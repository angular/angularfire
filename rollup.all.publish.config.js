import globals from './rollup-globals';

export default {
  entry: 'dist/bundle.js',
  dest: 'dist/bundles/angularfire2.all.umd.js',
  format: 'umd',
  moduleName: 'angularfire2',
  globals
};
