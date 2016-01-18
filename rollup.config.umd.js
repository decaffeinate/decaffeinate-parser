import config from './rollup.config';

config.entry = 'src/parser.js';
config.dest = 'dist/decaffeinate-parser.umd.js';
config.format = 'umd';
config.moduleName = 'decaffeinate.parser';
config.globals = {
  'coffee-script': 'CoffeeScript'
};

export default config;
