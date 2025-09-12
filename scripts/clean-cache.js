import fs from 'fs';
import path from 'path';

const cacheFile = path.join(process.cwd(), '.tinify-cache.json');

try {
    if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
        console.log('Cache file cleaned successfully!');
    } else {
        console.log('No cache file found.');
    }
} catch (error) {
    console.error('Failed to clean cache file:', error);
    process.exit(1);
}
