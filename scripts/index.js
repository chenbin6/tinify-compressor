#!/usr/bin/env node

import Compressor from '../lib/compressor.js';
import getKey from './keys.js';
import path from 'path';

const paths = process.argv.slice(2);
if (!paths) {
    console.error('Please provide a directory path');
    process.exit(1);
}

(async () => {
    let key = getKey();
    const _tinify = new Compressor(key);
    for (const filePath of paths) {
        const resolvedPath = path.resolve(filePath);
        let _continue = false;
        console.log({filePath});
        while (!_continue && key) {
            try {
                await _tinify.compressBatch(resolvedPath);
                _continue = true;
            } catch (err) {
                if (err === 'tinify.AccountError') {
                    key = getKey();
                    _continue = !!!key;
                } else {
                    _continue = true;
                }
            }
        }
    }
})();
