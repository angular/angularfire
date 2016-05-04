# 1. Installation and Setup

> Getting started with AngularFire2 is easy with the [Angular CLI](https://github.com/angular/angular-cli). Follow the 10 steps below to get started. Don't worry, we're always working to make this shorter.

**The setups below use the [Angular CLI](https://github.com/angular/angular-cli).**

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

### 3. Install typings

```bash
npm install typings -g
typings install --save --ambient firebase
```

AngularFire 2 is written in Typescript and depends on typings for the Firebase SDK. To get a clean build, install typings and download the Firebase typings.

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
      'zone.js/dist/*.js',
      'es6-shim/es6-shim.js',
      'reflect-metadata/*.js',
      'rxjs/**/*.js',
      '@angular/**/*.js',
      // above are the existing entries
      // below are the AngularFire entries
      'angularfire2/**/*.js',
      'firebase/lib/*.js'      
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
// TODO: Find the actual way to do this
```

AngularFire 2 and Firebase need to be mapped with System.js for module loading.

### 7. Bootstrap

Open `/src/app.ts`, inject the Firebase providers, and specify your default Firebase:

```ts
import { bootstrap } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { <MyApp>, environment } from './app/';
import {FIREBASE_PROVIDERS, defaultFirebase, AngularFire} from 'angularfire2';

if (environment.production) {
  enableProdMode();
}

bootstrap(<MyApp>, [
  FIREBASE_PROVIDERS,
  defaultFirebase('https://<your-firebase-app>.firebaseio.com')
]);
```

### 8. Inject AngularFire

Open `/src/app/<project-name>.component.ts`:

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

In `/src/app/project-name.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: '<my-app>-app',
  templateUrl: '<my-app>.component.html',
  styleUrls: ['<my-app>.component.css']
})
export class RcTestAppComponent {
  items: FirebaseListObservable<any[]>;
  constructor(af: AngularFire) {
    this.items = af.database.list('/items');
  }
}
```

Open `/src/app/<my-app>.component.html`:

```html
<ul *ngFor="let items of items | async">
  <li class="text">
    {{item}}
  </li>
</ul>
```

The `async` pipe unwraps the each item in the people
observable as they arrive.

### 10. Serve

```bash
ng serve
```

Run the serve command and go to `localhost:4200` in your browser.

And that's it! If it totally borke, file an issue and let us know.

###[Next Step: Retrieving data as objects](docs/2-retrieving-data-as-objects.md)