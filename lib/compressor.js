import tinify from 'tinify';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Queue from './queue.js';

class ImageCompressor {
    constructor(apiKey, options = {}) {
        this.queue = new Queue(options.concurrency);
        this.extensions = options.extensions || ['.png', '.jpg', '.jpeg', '.webp'];
        this.cacheFile = options.cacheFile || path.join(process.cwd(), '.tinify-cache.json');
        this.compressedFiles = this.loadCache();
        this.pendingCacheUpdates = new Map();
        this.updateTinifyKey(apiKey);
    }

    getFileHash(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('md5');
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

    getImageFiles(dir) {
        return new Promise((resolve, reject) => {
            const files = [];
            let pending = 0;

            const scan = currentDir => {
                pending++;
                fs.readdir(currentDir, {withFileTypes: true}, (err, items) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    items.forEach(item => {
                        const fullPath = path.join(currentDir, item.name);

                        if (item.isDirectory()) {
                            scan(fullPath);
                        } else {
                            if (this.extensions.includes(path.extname(item.name).toLowerCase())) {
                                files.push(fullPath);
                            }
                        }
                    });

                    pending--;
                    if (pending === 0) {
                        resolve(files);
                    }
                });
            };

            fs.stat(dir, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (stats.isFile()) {
                    if (this.extensions.includes(path.extname(dir).toLowerCase())) {
                        return resolve([dir]);
                    }
                    return resolve([]);
                } else if (stats.isDirectory()) {
                    scan(dir);
                }
            });
        });
    }

    compress(file) {
        return this.queue.enqueue(() => {
            return new Promise((resolve, reject) => {
                const {path: filePath, hash: originalHash} = file || {};

                const originalSize = fs.statSync(filePath).size;

                const source = tinify.fromFile(filePath);
                source.toFile(filePath, err => {
                    if (err) {
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
                            compressedAt: new Date().toISOString(),
                            reduction: `${reduction}%`
                        };
                        this.pendingCacheUpdates.set(compressedHash, compressionRecord);

                        console.log(
                            `tinify.key: ${tinify.key}  tinify.compressionCount: ${tinify.compressionCount} `
                        );
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    compressSingle(filePath) {
        if (this.extensions.includes(path.extname(filePath).toLowerCase())) {
            const hash = this.getFileHash(filePath);
            return this.compress({path: filePath, hash});
        }
        return null;
    }

    compressBatch(dir) {
        return this.getUncompressedFiles(dir)
            .then(files => {
                return Promise.all(files.map(file => this.compress(file)));
            })
            .then(() => {
                console.log('All images compressed successfully!');
            })
            .catch(error => {
                this.queue.clear();
                if (error instanceof tinify.AccountError) {
                    return Promise.reject('tinify.AccountError');
                }
                throw error;
            })
            .finally(() => {
                this.saveCache();
            });
    }

    updateTinifyKey(apiKey) {
        tinify.key = apiKey;
    }

    getUncompressedFiles(dir) {
        return this.getImageFiles(dir).then(files => {
            const _res = [];
            files.forEach(file => {
                const hash = this.getFileHash(file);
                if (!this.compressedFiles[hash] && !this.pendingCacheUpdates.has(hash)) {
                    _res.push({path: file, hash: hash});
                }
            });
            return _res;
        });
    }
}

export default ImageCompressor;
