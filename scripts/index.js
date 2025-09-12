#!/usr/bin/env node
import Compressor from '../lib/compressor.js';
import getKey from './keys.js';
import path from 'path';
import fs from 'fs';

const paths = process.argv.slice(2);
if (paths.length === 0) {
    console.error('Please provide a directory path');
    process.exit(1);
}

(async () => {
    let key = getKey();
    const _tinify = new Compressor(key);
    for (const filePath of paths) {
        const resolvedPath = path.resolve(filePath);
        
        // 检查路径是否存在
        if (!fs.existsSync(resolvedPath)) {
            console.error(`Path does not exist: ${resolvedPath}`);
            continue;
        }
        
        let _continue = false;
        while (!_continue && key) {
            try {
                await _tinify.compressBatch(resolvedPath);
                _continue = true;
            } catch (err) {
                if (err === 'tinify.AccountError') {
                    key = getKey();
                    _continue = !!!key;
                } else {
                    console.error(`Error compressing ${resolvedPath}:`, err);
                    _continue = true;
                }
            }
        }
    }
})();
