import Compressor from '../lib/compressor.js';
import getKey from './keys.js';

const _tinify = new Compressor(getKey());

const dirPath = process.argv[2];
if (!dirPath) {
    console.error('Please provide a directory path');
    process.exit(1);
}

const init = () => _tinify.compressBatch(path.resolve(dirPath));

const _catch = err => {
    if (err === 'tinify.AccountError') {
        const key = getKey();
        if (key) {
            _tinify.updateTinifyKey(key);
            return init().catch(_catch);
        }
    }
    return Promise.reject(err);
};
init().catch(_catch);
