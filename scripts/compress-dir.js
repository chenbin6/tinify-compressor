import dotenv from 'dotenv';
import ImageCompressor from '../lib/index.js';

dotenv.config();

const compressor = new ImageCompressor(process.env.TINIFY_API_KEY, {
    concurrency: parseInt(process.env.DEFAULT_CONCURRENCY),
    cacheFile: process.env.DEFAULT_CACHE_FILE,
    extensions: process.env.SUPPORTED_EXTENSIONS.split(',')
});

const dirPath = process.argv[2];
if (!dirPath) {
    console.error('Please provide a directory path');
    process.exit(1);
}

compressor
    .compressDirectory(path.resolve(dirPath))
    .then(() => {
        console.log('Directory compression completed successfully!');
    })
    .catch(error => {
        console.error('Directory compression failed:', error);
        process.exit(1);
    });
