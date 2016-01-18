import config from './rollup.config';

config.entry = 'src/parser.js';
config.dest = 'dist/decaffeinate-parser.es6.js';
config.format = 'es6';

export default config;
