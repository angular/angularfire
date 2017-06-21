import globals from './rollup-globals';
import replace from 'rollup-plugin-re'

export default {
  entry: 'dist/bundle.js',
  dest: 'dist/bundles/angularfire2.all.umd.js',
  format: 'umd',
  moduleName: 'angularfire2',
  globals,
   plugins: [
    replace({
      patterns: [
        {
          test: 'firebase.app(',
          replace: 'firebase.firebase.app(',
        },
        {
          test: 'firebase.initializeApp(',
          replace: 'firebase.firebase.initializeApp(',
        }
      ]
    })
    ]
};
