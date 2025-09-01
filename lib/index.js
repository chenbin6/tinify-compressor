import tinify from 'tinify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Queue from './queue.js';

class ImageCompressor {
    constructor(apiKey, options = {}) {
        tinify.key = apiKey;
        this.queue = new Queue(options.concurrency);
        this.extensions = options.extensions || ['.png', '.jpg', '.jpeg', '.webp'];
        this.cacheFile = options.cacheFile || path.join(process.cwd(), '.tinify-cache.json');
        this.compressedFiles = this.loadCache();
        this.pendingCacheUpdates = new Map();
    }

    getFileHash(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    }

    loadCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const data = fs.readFileSync(this.cacheFile, 'utf8');
                const parsed = JSON.parse(data);
                return parsed;
            }
            return {};
        } catch (error) {
            console.warn('Failed to load cache file, using empty cache', error);
            return {};
        }
    }

    saveCache() {
        try {
            const updatedCache = {...this.compressedFiles};
            for (const [hash, record] of this.pendingCacheUpdates) {
                updatedCache[hash] = record;
            }
            fs.writeFileSync(this.cacheFile, JSON.stringify(updatedCache, null, 2));
            this.pendingCacheUpdates.clear();
        } catch (error) {
            console.warn('Failed to save cache file', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getImageFiles(dir) {
        return new Promise((resolve, reject) => {
            const files = [];
            const scan = currentDir => {
                fs.readdir(currentDir, {withFileTypes: true}, (err, items) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    let pending = items.length;
                    if (pending === 0) {
                        resolve(files);
                        return;
                    }

                    items.forEach(item => {
                        const fullPath = path.join(currentDir, item.name);

                        if (item.isDirectory()) {
                            scan(fullPath);
                            if (--pending === 0) resolve(files);
                        } else {
                            if (this.extensions.includes(path.extname(item.name).toLowerCase())) {
                                files.push(fullPath);
                            }
                            if (--pending === 0) resolve(files);
                        }
                    });
                });
            };

            scan(dir);
        });
    }

    compressImage(filePath) {
        return this.queue.enqueue(() => {
            return new Promise((resolve, reject) => {
                const originalHash = this.getFileHash(filePath);

                if (
                    this.compressedFiles[originalHash] ||
                    this.pendingCacheUpdates.has(originalHash)
                ) {
                    const cacheInfo =
                        this.compressedFiles[originalHash] ||
                        this.pendingCacheUpdates.get(originalHash);
                    console.log(
                        `Skipping compressed file: ${filePath} (content same as ${cacheInfo.originalPath})`
                    );
                    resolve(filePath);
                    return;
                }

                const originalSize = fs.statSync(filePath).size;

                const source = tinify.fromFile(filePath);
                source.toFile(filePath, err => {
                    if (err) {
                        console.error(`Compression failed: ${filePath}`, err);
                        reject(err);
                    } else {
                        const compressedSize = fs.statSync(filePath).size;
                        const compressedHash = this.getFileHash(filePath);
                        const reduction = (
                            ((originalSize - compressedSize) / originalSize) *
                            100
                        ).toFixed(2);

                        const compressionRecord = {
                            originalPath: filePath,
                            originalSize,
                            compressedSize,
                            compressedHash,
                            compressedAt: new Date().toISOString()
                        };

                        this.pendingCacheUpdates.set(originalHash, compressionRecord);
                        this.pendingCacheUpdates.set(compressedHash, compressionRecord);

                        console.log(`Compression successful: ${filePath}`);
                        console.log(
                            `Before: ${this.formatFileSize(
                                originalSize
                            )} -> After: ${this.formatFileSize(
                                compressedSize
                            )} (Saved: ${reduction}%)`
                        );
                        resolve(filePath);
                    }
                });
            });
        });
    }

    compressDirectory(dir) {
        return this.getImageFiles(dir)
            .then(files => {
                return Promise.all(files.map(file => this.compressImage(file)));
            })
            .then(() => {
                this.saveCache();
                console.log('All images compressed successfully!');
            })
            .catch(error => {
                console.error('Error occurred:', error);
                throw error;
            });
    }
}

export default ImageCompressor;
