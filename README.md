# AngularFire2

Status: In-Development

## API

### FIREBASE_PROVIDERS

Contains all AngularFire provider configuration for Angular's dependency injection.

Type: `any[]`

Usage:

```
import {bootstrap} from 'angular2/core';
import {App} from './app';
import {FIREBASE_PROVIDERS} from 'angularFire2';

bootstrap(App, FIREBASE_PROVIDERS);
```

### DEFAULT_FIREBASE_REF

Injectable symbol to create a Firebase reference based on
the url provided by `DEFAULT_FIREBASE`.

Type: `Firebase`

Usage:

```
import {Inject} from 'angular2/core';
import {DEFAULT_FIREBASE_REF} from 'angular2fire';
...
class MyComponent {
  constructor(@Inject(DEFAULT_FIREBASE_REF) ref:Firebase) {
    ref.on('value', this.doSomething);
  }
}
```

### DEFAULT_FIREBASE

URL for the app's default Firebase database.

Type: `string`

Usage:

```
import {App} from './app';
import {bootstrap, provide} from 'angular2/core';
import {DEFAULT_FIREBASE, FIREBASE_PROVIDERS} from 'angularfire2';

bootstrap(App, [
  FIREBASE_PROVIDERS,
  provide(DEFAULT_FIREBASE, {
    useValue: 'https://my.firebaseio.com'
  })
]);
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
      path: '/questions', // Will append to the DEFAULT_FIREBASE if relative
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
