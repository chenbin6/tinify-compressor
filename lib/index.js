import Compressor from './compressor.js';
import getKey from './keys.js';

const _tinify = new Compressor(getKey());

const init = () => _tinify.compressBatch('./assets');

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
