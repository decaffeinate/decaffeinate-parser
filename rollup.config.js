import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

var pkg = require('./package.json');
var external = Object.keys(pkg.dependencies);

export default {
  entry: 'src/parser.js',
  plugins: [babel(babelrc())],
  external: external,
  targets: [
    {
      dest: pkg['main'],
      format: 'umd',
      moduleName: 'decaffeinate.parser',
      globals: {
        'coffee-script': 'CoffeeScript'
      }
    },
    {
      dest: pkg['jsnext:main'],
      format: 'es6'
    }
  ]
};
