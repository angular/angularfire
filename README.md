# AngularFire2

[![Build Status](https://travis-ci.org/angular/angularfire2.svg?branch=master)](https://travis-ci.org/angular/angularfire2)

Status: In-Development

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
    this.questions = af.list('/questions');
  }
}

bootstrap(App, [
  // Common injectable providers from the AngularFire lib
  FIREBASE_PROVIDERS,
  // Tell AngularFire the base URL for the Firebase used throughout
  defaultFirebase('https://<some-firebase>.firebaseio.com')
]);

```

The AngularFire service exposes methods to get Observables of Firebase data: `list` and `object`. `list` returns an observable that will emit a new array any time data at the specified location is updated.

```typescript
var questions = angularFire.list('/questions');
questions.subscribe(questions => {
  console.log(questions);
});
questions.add({title: 'how to Angular?'});
// log [{title: 'how to Angular?'}]
questions.add({title: 'how to Firebase?'});
// log [{title: 'how to Angular?'},{title: 'how to Firebase?'}]
```

`object` returns an observable that will emit a new object any time data at the specified location is updated.

```typescript
var question = angularFire.object('/questions/1');
question.subscribe(question => {
  console.log(question);
});
ref.set({title: 'how to Angular?'});
// log {title: 'how to Angular?'}
ref.set({title: 'how to ANGULAR?'});
// log {title: 'how to ANGULAR?'}
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
