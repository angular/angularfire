# 1. Installation and Setup

> Getting started with AngularFire2 is easy with the [Angular CLI](https://github.com/angular/angular-cli). Follow the 10 steps below to get started. Don't worry, we're always working to make this shorter.

**The setups below use the [Angular CLI](https://github.com/angular/angular-cli).**

### 0. Prerequisites

```bash
npm install -g angular-cli
npm install -g typings 
```

### 1. Create a new project

```bash
ng new <project-name>
cd <project-name>
```

The Angular CLI's `new` command will set up the latest Angular build in a new project structure.

### 2. Install AngularFire 2 and Firebase

```bash
npm install angularfire2 firebase --save
```

Now that you have a new project setup, install AngularFire 2 and Firebase from npm.

### 3. Include Firebase SDK typings

```bash
typings install file:node_modules/angularfire2/firebase3.d.ts --save --global && typings install
```

This saves the typings reference into `typings.json` and installs it.

Note: for typings < 1, use the `--ambient` flag instead of `--global`.

Unless you're targeting ES6 output in tsconfig.json, you'll also need to install
typings for the global Promise constructor. Run this command:

`$ typings install --save --global es6-promise`

If you're using Angular CLI, the typings will automatically be added to your
tsconfig since there is already a reference to `"typings.d.ts"` which transitively
includes `es6-promise`. If you're using a different seed project, or managing your
build yourself, just add the reference to your tsconfig files array:

```json
"files": [
  "node_modules/angularfire2/firebase3.d.ts",
  "typings/main.d.ts"
]
```


### 4. Include AngularFire 2 and Firebase in the vendor files

Open `angular-cli-build.js`.

Include AngularFire2 and Firebase in the `vendorNpmFiles` array:

```js
/* global require, module */

var Angular2App = require('angular-cli/lib/broccoli/angular2-app');

module.exports = function(defaults) {
  return new Angular2App(defaults, {
    vendorNpmFiles: [
      'systemjs/dist/system-polyfills.js',
      'systemjs/dist/system.src.js',
      'zone.js/dist/**/*.+(js|js.map)',
      'es6-shim/es6-shim.js',
      'reflect-metadata/**/*.+(js|js.map)',
      'rxjs/**/*.+(js|js.map)',
      '@angular/**/*.+(js|js.map)',
      // above are the existing entries
      // below are the AngularFire entries
      'angularfire2/**/*.js',
      'firebase/*.js'      
    ]
  });
};
```

### 5. Build

```bash
ng build
```

Run a build and check the `/dist/vendor` folder for the `angularfire2` and `firebase` folders.

### 6. System.js

Open `/src/system-config.ts`. Modify the file like below:

```js
/** Map relative paths to URLs. */
const map: any = {
  'firebase': 'vendor/firebase/firebase.js',
  'angularfire2': 'vendor/angularfire2'
};

/** User packages configuration. */
const packages: any = {
  angularfire2: {
    defaultExtension: 'js',
    main: 'angularfire2.js'
  }
};
```

AngularFire 2 and Firebase need to be mapped with System.js for module loading.

### 7. Bootstrap

Open `/src/main.ts`, inject the Firebase providers, and specify your Firebase configuration. 
This can be found in your project at [the Firebase Console](https://console.firebase.google.com):

```ts
import { BrowserModule } from '@angular/platform-browser';
import { enableProdMode, NgModule } from '@angular/core';
import { <MyApp>, environment } from './app/';
import { AngularFireModule } from 'angularfire2';

const firebaseConfig = {
  apiKey: "<your-key>",
  authDomain: "<your-project-authdomain>",
  databaseURL: "<your-database-URL>",
  storageBucket: "<your-storage-bucket>"
}

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  declarations: [ MyComponent ],
  Bootstrap: [ MyComponent ]
})
export class MyAppModule {}

```

### 8. Inject AngularFire

Open `/src/app/<my-app>.component.ts`, and make sure to modify/delete any tests to get the sample working (tests are still important, you know):

```ts
import { Component } from '@angular/core';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: '<my-app>-app',
  templateUrl: '<my-app>.component.html',
  styleUrls: ['<my-app>.component.css']
})
export class <MyApp>Component {
  constructor(af: AngularFire) {
    
  }
}

```

### 9. Bind to a list

In `/src/app/<my-app>.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: '<my-app>-app',
  templateUrl: '<my-app>.component.html',
  styleUrls: ['<my-app>.component.css']
})
export class <MyApp>Component {
  items: FirebaseListObservable<any[]>;
  constructor(af: AngularFire) {
    this.items = af.database.list('items');
  }
}
```

Open `/src/app/<my-app>.component.html`:

```html
<ul>
  <li class="text" *ngFor="let item of items | async">
    {{item.$value}}
  </li>
</ul>
```

The `async` pipe unwraps the each item in the people
observable as they arrive. Also the array that is received through the `items` observable contains objects that have a `$value` property. A structure like this:
```
[
  {
    $value: 'something',
    (...)
  },
  {
    $value: 'something else',
    (...)
  },
]
```

### 10. Serve

```bash
ng serve
```

Run the serve command and go to `localhost:4200` in your browser.

And that's it! If it totally borke, file an issue and let us know.

###[Next Step: Retrieving data as objects](2-retrieving-data-as-objects.md)
