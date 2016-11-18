# 1. Installation and Setup

At this point you should have an Angular 2 app made by the angular-cli with angularfire2 module added. If not, please go through the installation process [here](https://github.com/angular/angularfire2/blob/master/docs/1-install-and-setup.md). Also, before you move forward please take a look at the [Angular Docs](https://angular.io/docs/ts/latest/cookbook/aot-compiler.html) to understand the basic concept.

### 0. Prerequisites

Before you can have your shiny and fast precompiled app make sure you have the followings installed:
- @angular/compiler-cli
- rollup (with its plugins)
- core-js typings 

If not, you may need to do the following:

```bash
npm install --save @angular/compiler-cli
npm install --save-dev rollup rollup-plugin-commonjs rollup-plugin-node-resolve rollup-plugin-uglify @types/core-js
```

### 1. Create tsconfig for ngc

Create `tsconfig.aot.json` in your projects root:

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "es2015",
    "moduleResolution": "node",
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "removeComments": false,
    "suppressImplicitAnyIndexErrors": true,
    "typeRoots": [
      "../node_modules/@types"
    ],
    "types": [
      "core-js",
      "firebase"
    ]
  },

  "files": [
    "src/app/app.module.ts",
    "src/main.ts",
    "src/typings.d.ts"
  ],

  "angularCompilerOptions": {
    "genDir": "aot",
    "skipMetadataEmit" : true
  }
}
```

If you want to test if it works, type:

```
node_modules/.bin/ngc -p tsconfig.aot.json
```

On a successful compilation you'll see nothing on your console.

Note: You will have to change your imports as mentioned in the [Angular Docs#Bootstrap](https://angular.io/docs/ts/latest/cookbook/aot-compiler.html#!#bootstrap) section and recompile your app after it.

### 2. Add rollup config

Create `rollup.js` in your projects root:

```javascript
import rollup from 'rollup';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/main.js',
  dest: 'dist/build.js',
  sourceMap: false,
  format: 'iife',
  useStrict: false,
  plugins: [
	nodeResolve({ jsnext: true, module: true, browser: true }),  
    commonjs({
      include: [
        'node_modules/rxjs/**',
        'node_modules/angularfire2/**'
      ],
      namedExports: {
        'node_modules/angularfire2/node_modules/firebase/firebase-browser.js': ['initializeApp', 'auth', 'database']
      }
    }),
    uglify()
  ]
}
```

Once done, run rollup with the configuration you just made:

```
node_modules/.bin/rollup -c rollup.js
```

You will see a couple warnings, something like these, which you can safely ignore:

```
The `this` keyword is equivalent to `undefined` at the top level of an ES module, and has been rewritten
Use of `eval` (in .../node_modules/angularfire2/node_modules/firebase/firebase.js) is strongly discouraged, as it poses security risks and may cause issues with minification. See https://github.com/rollup/rollup/wiki/Troubleshooting#avoiding-eval for more details
Use of `eval` (in .../node_modules/angularfire2/node_modules/firebase/firebase.js) is strongly discouraged, as it poses security risks and may cause issues with minification. See https://github.com/rollup/rollup/wiki/Troubleshooting#avoiding-eval for more details

```

On success you will have a `build.js` file in your `dist` directory. You're not done yet, however.

### 3. Modify index.html

You have now a working, AoT compiled javascript file. Take a look at the (Angular Docs#Source Code)[https://angular.io/docs/ts/latest/cookbook/aot-compiler.html#!#source-code] section and set up your index.html accordingly.

### * Using native firebase SDK with angularfire2

Since there are a couple things that angularfire2 doesn't support yet (such as multi-location update), you might want to use the native firebase SDK as well. To do that you'll have to do a couple things:

Wherever you used `firebase` in your app, import firebase like: 

```
import firebase from 'firebase'
```

Your editor will most probably complain about it, so to make it happy add the following line to your `tsconfig` (both of them)

```
"allowSyntheticDefaultImports": true
```

Depending on your firebase version you will have to modify your rollup config and add the following (one of the two) line to your `namedExports` array:

### < 3.4

```
'node_modules/firebase/firebase-browser.js': ['initializeApp', 'auth', 'database']
```

### 3.4+

```
'node_modules/firebase/firebase.js': ['initializeApp', 'auth', 'database']
```

And finally, add the following line to your `include` array:

```
'node_modules/firebase/**'
```