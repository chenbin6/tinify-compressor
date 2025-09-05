#!/usr/bin/env node

import Compressor from '../lib/compressor.js';
import getKey from './keys.js';
import path from 'path';

const dirPath = process.argv[2];
if (!dirPath) {
    console.error('Please provide a directory path');
    process.exit(1);
}

let key = getKey();
const _tinify = new Compressor(key);

const init = () => _tinify.compressBatch(path.resolve(dirPath));

const _catch = err => {
    if (err === 'tinify.AccountError') {
        key = getKey();
        if (key) {
            _tinify.updateTinifyKey(key);
            return init().catch(_catch);
        }
    }
    return Promise.reject(err);
};
init().catch(_catch);
