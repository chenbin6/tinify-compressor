import dotenv from 'dotenv';
import ImageCompressor from '../lib/index.js';

dotenv.config();

const compressor = new ImageCompressor(process.env.TINIFY_API_KEY, {
    concurrency: parseInt(process.env.DEFAULT_CONCURRENCY),
    cacheFile: process.env.DEFAULT_CACHE_FILE,
    extensions: process.env.SUPPORTED_EXTENSIONS.split(',')
});

const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide a file path');
    process.exit(1);
}

compressor
    .compressImage(path.resolve(filePath))
    .then(() => {
        console.log('Compression completed successfully!');
    })
    .catch(error => {
        console.error('Compression failed:', error);
        process.exit(1);
    });
