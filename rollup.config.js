import 'rollup';
import typescript from '@rollup/plugin-typescript';
import buble from '@rollup/plugin-buble';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

/**
 * Default/development Build
 */
const config = {
    input: 'src/index.ts',
    output: {
        file: 'dist/skyline-editor.js',
        format: 'es',
    },
    plugins: [

        typescript({
            typescript: require('typescript')
        }),
        buble({
            transforms: {
                forOf: false,

            }
        }),
        nodeResolve({
            jsnext: true,
            main: true
        }),
        commonjs()
    ]
}

// Minified JS Build
/*
if (process.env.BUILD === 'minify') {
    config.targets = [{dest: 'dist/myModuleName.min.js', format: 'umd', moduleName: 'myModuleName', sourceMap: false}];
    config.plugins.push(
        uglify({}, minify)
    );
}
*/
// Report destination paths on console
console.info(`\u001b[36m\[Rollup ${process.env.BUILD} build\]\u001b[97m \nConverting Typescript from ${
config.input} to javascript, exporting to: ${config.output.file}`);

export default config