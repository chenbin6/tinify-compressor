#!/usr/bin/env node
import Compressor from '../lib/compressor.js';
import getKey from './keys.js';
import path from 'path';
import fs from 'fs';

// 解析命令行参数，分离路径和选项
const args = process.argv.slice(2);
const paths = [];
const options = {};

args.forEach(arg => {
    if (arg === '--no-cache') {
        options.useCache = false;
    } else {
        paths.push(arg);
    }
});

console.log('Args:', args);
console.log('Paths:', paths);
console.log('Options:', options);

if (paths.length === 0) {
    console.error('Please provide a directory path');
    console.error('Options:');
    console.error(
        '  --no-cache  Disable cache and compress all images regardless of previous compression'
    );
    process.exit(1);
}

(async () => {
    let key = getKey();
    const _tinify = new Compressor(key, options);
    for (const filePath of paths) {
        const resolvedPath = path.resolve(filePath);

        if (!fs.existsSync(resolvedPath)) {
            console.error(`Path does not exist: ${resolvedPath}`);
            continue;
        }

        let _return = false;
        while (!_return && key) {
            try {
                await _tinify.compressBatch(resolvedPath);
                _continue = true;
            } catch (err) {
                if (err === 'tinify.AccountError') {
                    key = getKey();
                    _return = !key;
                    _tinify.updateTinifyKey(key);
                } else {
                    console.error(`Error compressing ${resolvedPath}:`, err);
                    _return = true;
                }
            }
        }
    }
})();
