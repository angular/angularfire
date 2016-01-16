# AngularFire2

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

Type: string
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
