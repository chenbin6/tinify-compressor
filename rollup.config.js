// import resolve from '@rollup/plugin-node-resolve';
// import terser from '@rollup/plugin-terser';

export default {
    input: 'lib/compressor.js',
    output: [
        {
            file: 'dist/index.cjs',
            format: 'cjs',
            exports: 'auto'
        },
        {
            file: 'dist/index.esm.js', // ES Module 格式
            format: 'es'
        },
        {
            file: 'dist/index.umd.js', // UMD 格式
            format: 'umd',
            name: 'ImageCompressor'
        }
    ],
    plugins: [
        // resolve(),
        // terser()
    ],
    external: ['tinify'] // 指定外部依赖
};
