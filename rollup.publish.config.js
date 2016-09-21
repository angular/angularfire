import globals from './rollup-globals';

export default {
  entry: 'dist/index.js',
  dest: 'dist/bundles/angularfire2.umd.js',
  format: 'umd',
  moduleName: 'angularFire2',
  globals
}
