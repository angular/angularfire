import globals from './rollup-globals';

export default {
  entry: 'dist/test-root.js',
  dest: 'dist/bundles/test-root.umd.js',
  format: 'umd',
  moduleName: 'angularFire2.test',
  globals
}
