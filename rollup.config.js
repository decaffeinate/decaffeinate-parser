import babel from 'rollup-plugin-babel';
import { readFileSync } from 'fs';

const babelConfig = JSON.parse(readFileSync('.babelrc', { encoding: 'utf8' }));
babelConfig.presets = babelConfig.presets.map(preset => preset === 'es2015' ? 'es2015-rollup' : preset);
babelConfig.babelrc = false;

export default {
  plugins: [babel(babelConfig)],
  external: ['coffee-script']
};
