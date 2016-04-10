# AngularFire2

[![Build Status](https://travis-ci.org/angular/angularfire2.svg?branch=master)](https://travis-ci.org/angular/angularfire2)

Status: In-Development

## Realtime bindings and authentication for Angular 2

AngularFire2 integrates Firebase's realtime observers and authentication with Angular2.

### Example use:

```ts
import {Component} from 'angular2/core';
import {AngularFire} from 'angularfire2';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'project-name-app',
  providers: [],
  templateUrl: 'app/project-name-app.html',
  directives: [],
  pipes: []
})
export class MyApp {
  items: Observable<any[]>;
  constructor(af: AngularFire) {
    this.items = af.database.list('/items');
  }
}
```

## Install

```bash
npm install angularfire2 --save
```

## 10 steps to AngularFire2

*Don't worry, we're working to make this shorter.*

To build with AngularFire 2, make sure you have the [Angular CLI](https://github.com/angular/angular-cli) installed. Then follow the steps below.

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

Now that you have a new project setup, install AngularFire 2 and Firebase from NPM.


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

## API

### AngularFire Service

The recommended way to take advantage of the AngularFire library is to
use the injectable AngularFire service.

```typescript
import {Component} from 'angular2/core';
import {bootstrap} from 'angular2/platform/browser';
import {Observable} from 'rxjs/Observable';
import {FIREBASE_PROVIDERS, defaultFirebase, AngularFire} from 'angularfire2';
import {Question} from './services/question';

@Component({
  template:`
    <ul>
      <li *ngFor="#question of questions | async">
        {{question.text}}
      </li>
    </ul>
  `
})
class App {
  questions:Observable<Question[]>
  constructor(af:AngularFire) {
    // Get an observable of a synchronized array from <firebase-root>/questions
    this.questions = af.database.list('/questions');
  }
}

bootstrap(App, [
  // Common injectable providers from the AngularFire lib
  FIREBASE_PROVIDERS,
  // Tell AngularFire the base URL for the Firebase used throughout
  defaultFirebase('https://<some-firebase>.firebaseio.com')
]);

```

### FIREBASE_PROVIDERS

Contains all AngularFire provider configuration for Angular's dependency injection.

Type: `any[]`

Usage:

```
import {bootstrap} from 'angular2/platform/browser';
import {App} from './app';
import {FIREBASE_PROVIDERS} from 'angularfire2';

bootstrap(App, FIREBASE_PROVIDERS);
```

### defaultFirebase

Define the root url for the library, to resolve relative paths.

Type: `string`

Usage:

```
import {bootstrap} from 'angular2/platform/browser';
import {FIREBASE_PROVIDERS, defaultFirebase} from 'angularfire2';

bootstrap(App, [
  FIREBASE_PROVIDERS,
  defaultFirebase('https://my.firebaseio.com')
]);
```

### FirebaseRef

Injectable symbol to create a Firebase reference based on
the url provided by `FirebaseUrl`.

Type: `Firebase`

Usage:

```
import {Inject} from 'angular2/core';
import {FirebaseRef} from 'angularfire2';
...
class MyComponent {
  constructor(@Inject(FirebaseRef) ref:Firebase) {
    ref.on('value', this.doSomething);
  }
}
```

### FirebaseUrl

URL for the app's default Firebase database.

Type: `string`

Usage:

```
import {bootstrap} from 'angular2/platform/browser';
import {Inject} from 'angular2/core';
import {FirebaseUrl, FIREBASE_PROVIDERS, defaultFirebase} from 'angularfire2';

@Component({
  selector: 'app',
  template: `<a [href]="url">{{ url }}</a>`
})
class App {
  constructor(@Inject(FirebaseUrl) public url: string) {}
}

bootstrap(App, [
  FIREBASE_PROVIDERS,
  defaultFirebase('https://my.firebaseio.com')
]);
```

### FirebaseAuth

Injectable service for managing authentication state.

#### Logging In
To log in a user, call the `login` method on an instance of `FirebaseAuth` class. The method has
the following two signatures:

```typescript
login(config?: AuthConfiguration): Promise<FirebaseAuthState>;
login(credentials: AuthCredentials, config?: AuthConfiguration): Promise<FirebaseAuthState>;
```
The signature that is used depends on which AuthMethod you chose to use to login.
AuthMethods.Popup, AuthMethods.Redirect, and AuthMethods.Anonymous all use the first signature whereas
AuthMethods.CustomToken, AuthMethods.OAuthToken, and AuthMethods.Password use the second signature. This is
because if you use these three AuthMethods you need to provide a credentials argument to login.

##### AuthConfiguration
You **MUST** provide an `AuthConfiguration` object to use the `login` method, however you do not need
to pass it to login correctly. Instead you may choose to pass the configuration in through DI. This helps
keep your components modular because they can simply call `login` and it will use whichever options were
provided through DI.
You can use the `firebaseAuthConfigMethod` to generate a `Provider` object which you can pass to DI like so:

```typescript
import {bootstrap} from 'angular2/core';
import {
  FIREBASE_PROVIDERS,
  defaultFirebase,
  firebaseAuthConfig,
  AuthProviders,
  AuthMethods
} from 'angularfire2';
bootstrap(MyApp, [
  FIREBASE_PROVIDERS,
  defaultFirebase('https://<some-firebase>.firebaseio.com'),
  firebaseAuthConfig({
    provider: AuthProviders.Facebook,
    method: AuthMethods.Popup,
    remember: 'default',
    scope: ['email']
  })
]);
```
Once you've done that you can simply call `login` on the auth object. This will automatically use the options that were configured with DI. You can override those options by providing an optional configuration object to the `login` method like so:

```typescript
import {Component} from 'angular2/core';
import {FirebaseAuth} from 'angularfire2';

@Component({
  selector: 'my-component'
  templateUrl: 'my_template.html'
})
export class MyApp {
  constructor (private _auth: FirebaseAuth) {}

  public doLogin () {
    // This will perform popup auth with google oauth and the scope will be email
    // Because those options were provided through bootstrap to DI, and we're overriding the provider.
    this._auth.login({
      provider: AuthProviders.Google
    });
  }
}
```

#### Subscribing to Authentication State

Type: `class FirebaseAuth extends ReplaySubject<FirebaseAuthState>`

Usage:
```Typescript
import {FirebaseAuth} from 'angularfire2';
@Component({
  selector: 'auth-status',
  template: `
    <div *ng-if="auth | async">You are logged in</div>
    <div *ng-if="!(auth | async)">Please log in</div>
  `
})
class App {
  constructor (@Inject(FirebaseAuth) public auth: FirebaseAuth) {}
}
```

### FirebaseListObservable

Subclass of rxjs `Observable` which also has methods for updating
list-like Firebase data.

type: `class`

additional methods:

`add:(val) => void`: Add an element to the Firebase ref.
