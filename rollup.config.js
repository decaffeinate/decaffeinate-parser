import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import * as TypeScript from 'typescript';
import ts from 'rollup-plugin-typescript';

var pkg = require('./package.json');
var external = Object.keys(pkg.dependencies);

export default {
  entry: 'src/parser.js',
  plugins: [
    babel(babelrc()),
    ts({ typescript: TypeScript })
  ],
  external: external,
  targets: [
    {
      dest: pkg['main'],
      format: 'umd',
      moduleName: 'decaffeinate.parser',
      globals: {
        'decaffeinate-coffeescript': 'CoffeeScript'
      }
    },
    {
      dest: pkg['jsnext:main'],
      format: 'es'
    }
  ]
};
