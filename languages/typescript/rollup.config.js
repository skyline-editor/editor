import 'rollup';
import typescript from '@rollup/plugin-typescript';
import buble from '@rollup/plugin-buble';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts'
import { uglify } from 'rollup-plugin-uglify';
import { minify } from 'uglify-js';

/**
 * Default/development Build
 */
const config = [
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/index.js',
            format: 'es',
        },
        plugins: [

            typescript({
                typescript: require('typescript')
            }),
            buble({
                transforms: {
                    forOf: false,
                    generator: false,
                }
            }),
            nodeResolve({
                jsnext: true,
                main: true
            }),
            commonjs()
        ],
    },
    {
        // path to your declaration files root
        input: './dist/dts/index.d.ts',
        output: [{ file: 'dist/index.d.ts', format: 'es' }],
        plugins: [dts()],
    },
];

// Minified JS Build
if (process.env.BUILD === 'minify') {
    config[0].plugins.push(
        uglify({}, minify)
    );
}

// Report destination paths on console
console.info(`\u001b[36m\[Rollup ${process.env.BUILD} build\]\u001b[97m \nConverting Typescript from ${
config[0].input} to javascript, exporting to: ${config[0].output.file}`);

export default config