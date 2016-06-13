declare var System: any;

System.config({
  defaultExtension: 'js',
  map: {
    'firebase': '/node_modules/firebase/firebase.js',
    'angularfire2': '/dist',
    'typescript': '/node_modules/typescript/lib/typescript.js',
    '@angular': '/node_modules/@angular',
    'rxjs': '/node_modules/rxjs',
    'test': '/dist-test/'
  },
  packages: {
    'test': {
      defaultExtension: 'js'
    },
    'rxjs': {
      defaultExtension: 'js',
    },
    '@angular/core': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/common': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/compiler': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/platform-browser': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    '@angular/platform-browser-dynamic': {
      main: 'index.js',
      defaultExtension: 'js'
    },
    'angularfire2': {
      main: 'angularfire2.js',
      defaultExtension: 'js'
    }
  }
});
