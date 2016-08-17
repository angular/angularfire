#API Reference

**Work in progress. [See the developer guide](/docs/1-install-and-setup.md) for a comprehensive walkthrough of AngularFire2.**

### AngularFire Service

The recommended way to take advantage of the AngularFire library is to
use the injectable AngularFire service.

```typescript
import {Component} from '@angular/core';
import {bootstrap} from '@angular2/platform-browser';
import {Observable} from 'rxjs/Observable';
import {FIREBASE_PROVIDERS, defaultFirebase, AngularFire} from 'angularfire2';
import {Question} from './services/question';

@Component({
  template:`
    <ul>
      <li *ngFor="let question of questions | async">
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

```ts
import {bootstrap} from '@angular/platform-browser';
import {App} from './app';
import {FIREBASE_PROVIDERS} from 'angularfire2';

bootstrap(App, FIREBASE_PROVIDERS);
```

### defaultFirebase

Define the root url for the library, to resolve relative paths.

Type: `string`

Usage:

```ts
import {bootstrap} from '@angular/platform-browser';
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

```ts
import {Inject} from '@angular/core';
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

```ts
import {bootstrap} from '@angular/platform-browser';
import {Inject} from '@angular/core';
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

```ts
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

```ts
import {bootstrap} from '@angular/core';
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

```ts
import {Component} from '@angular/core';
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
```ts
import {FirebaseAuth} from 'angularfire2';
@Component({
  selector: 'auth-status',
  template: `
    <div *ngIf="auth | async">You are logged in</div>
    <div *ngIf="!(auth | async)">Please log in</div>
  `
})
class App {
  constructor (@Inject(FirebaseAuth) public auth: FirebaseAuth) {}
}
```
Alternatively, if you wish to extend an existing AngularFire component to monitor authentication status:
```
ts
import {AngularFire, FirebaseAuth} from 'angularfire2';
@Component({
  selector: 'auth-status',
  template: `
    <div *ngIf="af.auth | async">You are logged in</div>
    <div *ngIf="!(af.auth | async)">Please log in</div>
  `
})
class App {
  constructor(public af: AngularFire) {
    this.af.auth.subscribe(auth => console.log(auth));
  }
}

```

### FirebaseListObservable

Subclass of rxjs `Observable` which also has methods for updating
list-like Firebase data.

Type: `class`

Properties:

`$ref:(firebase.database.Reference)`: The reference used to sync this
collection to the Firebase database. See
[firebase.database.Reference](https://firebase.google.com/docs/reference/js/firebase.database.Reference)

Methods:

`push:(val) => Promise`: Add an element to the Firebase Database. 
This is the equivalent of the Firebase SDK's  
[set() method](https://firebase.google.com/docs/reference/js/firebase.database.Reference#set).
See [Saving Data](https://firebase.google.com/docs/database/web/save-data) 
for info about restricted characters in object keys and more details about
saving data in the Database.

`update:(item:Object) => void`: Replace any child keys provided in `val`
with the values provided, but do not touch any other keys in the element.
This is the equivalent of the Firebase SDK's 
[update() method](https://firebase.google.com/docs/reference/js/firebase.database.Reference#update).

`remove:([item]) => void`: Remove an element from the Firebase Database.
If no `item` argument is provided, it removes all elements from the list.
 This is the equivalent of the Firebase SDK's
 [remove() method](https://firebase.google.com/docs/reference/js/firebase.database.Reference#remove).

### FirebaseObjectObservable

Subclass of rxjs `Observable` which also has methods for syncing and
updating object-like Firebase data. {For collections and lists, see
FirebaseListObservable.)

Type: `class`

Properties:

`$ref:(firebase.database.Reference)`: The reference used to sync
this collection to the Firebase database. See 
[firebase.database.Reference](https://firebase.google.com/docs/reference/js/firebase.database.Reference)

Methods:

`set:(val:any) => Promise`: Replaces any data at this path in the Database
 with the value provided here (or adds the data if it doesn't exist). 
 This is the equivalent of the Firebase SDK's  
[set() method](https://firebase.google.com/docs/reference/js/firebase.database.Reference#set).
See [Saving Data](https://firebase.google.com/docs/database/web/save-data) 
for info about restricted characters in object keys and more details about
saving data in the Database.

`update:(val:Object) => void`: Replace any child keys provided in `val`
with the values provided here. The primary difference between this method
and `set()` above, is that `update()` modifies only the keys provided,
leaving any other data untouched, where `set()` essentially replaces
all data at the given path.
This is the equivalent of the Firebase SDK's 
[update() method](https://firebase.google.com/docs/reference/js/firebase.database.Reference#update).

`remove:() => void`: Remove an element from the Firebase Database.
If no `item` argument is provided, it removes all elements from the list.
 This is the equivalent of the Firebase SDK's
 [remove() method](https://firebase.google.com/docs/reference/js/firebase.database.Reference#remove).
