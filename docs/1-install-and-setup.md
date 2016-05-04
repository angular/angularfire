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
  var app = new Angular2App(defaults, {
    vendorNpmFiles: [
      'angularfire2/**/*.js',
      'firebase/lib/*.js'
    ]
  });
  return app.toTree();
}
```

### 5. Build

```bash
ng build
```

Run a build and check the `/dist/vendor` folder for the `angularfire2` and `firebase` folders.

### 6. System.js

Open `/src/index.html`. Modify the `System.config` like below:

```js
System.config({
  map: {
    firebase: 'vendor/firebase/lib/firebase-web.js',
    angularfire2: 'vendor/angularfire2'
  },
  packages: {
    app: {
      format: 'register',
      defaultExtension: 'js'
    },
    angularfire2: {
      defaultExtension: 'js',
      main: 'angularfire2.js'
    }
  }
});
```

AngularFire 2 and Firebase need to be mapped with System.js for module loading.

### 7. Bootstrap

Open `/src/app.ts`:

```ts
import {bootstrap} from 'angular2/platform/browser';
import {MyAppClass} from './app/<my-app-class>';
import {ROUTER_PROVIDERS} from 'angular2/router';
import {FIREBASE_PROVIDERS, defaultFirebase, AngularFire} from 'angularfire2';

bootstrap(<MyAppClass>, [
  FIREBASE_PROVIDERS,
  defaultFirebase('https://<your-firebase>.firebaseio.com'),
  ROUTER_PROVIDERS
]);
```

### 8. Inject AngularFire

Open `/src/app/project-name.ts`:

```ts
import {Component} from 'angular2/core';
import {RouteConfig, ROUTER_DIRECTIVES} from 'angular2/router';
import {AngularFire} from 'angularfire2';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'project-name-app',
  providers: [],
  templateUrl: 'app/project-name-app.html',
  directives: [ROUTER_DIRECTIVES],
  pipes: []
})
@RouteConfig([

])
export class ProjectNameApp {
  constructor(af: AngularFire) {

  }
}
```

### 9. Bind to a list

In `/src/app/project-name.ts`:

```ts
import {Component} from 'angular2/core';
import {RouteConfig, ROUTER_DIRECTIVES} from 'angular2/router';
import {AngularFire} from 'angularfire2';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'project-name-app',
  providers: [],
  templateUrl: 'app/project-name-app.html',
  directives: [ROUTER_DIRECTIVES],
  pipes: []
})
@RouteConfig([

])
export class ProjectNameApp {
  items: Observable<any[]>;
  constructor(af: AngularFire) {
    // create a list at /items
    this.items = af.database.list('/items');
  }
}
```

Open `/src/app/project-name.html`:

```html
<ul *ngFor="#item of items | async">
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

###[Next Step: Retreiving data](/docs/2-retreiving-data-as-objects.md)