# AngularFire2

[![Build Status](https://travis-ci.org/angular/angularfire2.svg?branch=master)](https://travis-ci.org/angular/angularfire2)

Status: In-Development

## API

### FIREBASE_PROVIDERS

Contains all AngularFire provider configuration for Angular's dependency injection.

Type: `any[]`

Usage:

```
import {bootstrap} from 'angular2/core';
import {App} from './app';
import {FIREBASE_PROVIDERS} from 'angularfire2';

bootstrap(App, FIREBASE_PROVIDERS);
```

### defaultFirebase

Define the root url for the library, to resolve relative paths.

Type: `string`

Usage:

```
import {bootstrap} from 'angular2/core';
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

### FirebaseList

A convenient provider to inject a remote list of
Firebase into a component.

Type: `(FirebaseListConfig | string) => Provider` (from angular2/core)

Usage:

```typescript
import {Component, Inject} from 'angular2/core';
import {FirebaseList} from 'angularfire2';

@Component({
  selector: 'questions-list',
  providers: [
    FirebaseList({
      token: Question, // Token used to inject in the constructor
      path: '/questions', // Will append to the FirebaseUrl if relative
    }),
    // Passing just a string will make that the path AND the token used with @Inject
    FirebaseList('/topics')
  ],
  template: `
    <h1>Questions</h1>
    <ul>
      <li *ngFor="#question of questions | async">
        Asked by: {{question.author}}
        Question: {{question.body}}
      </li>
    </ul>
    <h1>Hot Topics</h1>

  `
})
class QuestionsList {
  constructor(
    @Inject('/questions') public questions:FirebaseObservable<Question>,
    @Inject('/topics') public topics:FirebaseObservable<any>) {
  }
}
```

### FirebaseUrl

URL for the app's default Firebase database.

Type: `string`

Usage:

```
import {bootstrap, Inject} from 'angular2/core';
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

Injectable service for managing authentication state. It currently only supports
reading auth state.

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

### FirebaseListConfig

Interface for config object that can be provided to `FirebaseList`

Type:
```
interface FirebaseListConfig {
  token?:any;
  path?: string;
}
```

### FirebaseObservable

Subclass of `rxjs/Observable` with instance methods for updating Firebase
data. Typically this is instantiated by the AngularFire library, not by end
users.

type: `class`

additional methods:

`add:(val) => void`: Add an element to the Firebase ref.
