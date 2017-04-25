# Upgrading to AngularFire2 4.0

AngularFire2 4.0 is a refactor of the AngularFire2 package which implements
@NgModule, simplifies authentication, and better supports Angular 4.

### Removing `AngularFire` for Modularity

Prior to 4.0, AngularFire2 did not take advantage of the Firebase SDK's modularity for tree shaking. The `AngularFire` service has now been removed and the library broken up into smaller @NgModules:

* `AngularFireModule`
* `AngularFireDatabaseModule`
* `AngularFireAuthModule`

When upgrading, replace calls to `AngularFire.database` and `AngularFire.auth` with `AngularFireDatabase` and `AngularFireAuth` respectively.

```typescript
constructor(af: AngularFire) {
  af.database.list('foo');
  af.auth;
}
```
Should now be:

```typescript
constructor(db: AngularFireDatabase, afAuth: AngularFireAuth) {
  db.list('foo');
  afAuth.authState;
}
```

### Simplified Authentication API

In 4.0 we've reduced the complexity of the auth module by providing only a [`firebase.User`](https://firebase.google.com/docs/reference/js/firebase.User) observer (`AngularFireAuth.authState`) and cutting the methods that were wrapping the Firebase SDK.

```typescript
import { AngularFireAuth } from 'angularfire2/auth';
// Do not import from 'firebase' as you'd lose the tree shaking benefits
import * as firebase from 'firebase/app';
...

user: Observable<firebase.User>;
constructor(afAuth: AngularFireAuth) {
  this.user = afAuth.authState;
}
```

AngularFire2 exposes the raw Firebase Auth object via `AngularFireAuth.auth`. For actions like login, logout, user creation, etc. you should use the [methods available to `firebase.auth.Auth`](https://firebase.google.com/docs/reference/js/firebase.auth.Auth).

While convenient, the pre-configured login feature added unneeded complexity. `AngularFireModule.initializeApp` no longer takes a default sign in method. Sign in should be done with the Firebase SDK via `firebase.auth.Auth`:

```typescript
login() {
  this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
}
logout() {
  this.afAuth.auth.signOut();
}
```

### FirebaseListFactory and FirebaseObjectFactory API Changes

If you directly use `FirebaseListFactory` or `FirebaseObjectFactory` you will no longer be able to pass in a string, it will instead expect a Firebase database reference.

## Putting this all together

Here's an example of what AngularFire2 4.0 looks like:

```typescript
import { NgModule, Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule, AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { AngularFireAuthModule, AngularFireAuth } from 'angularfire2/auth';
import { environment } from '../environments/environment';

// Do not import from 'firebase' as you'd lose the tree shaking benefits
import * from 'firebase/app';


@NgModule({
  declarations: [ App ],
  exports: [ App ],
  imports: [ 
    AngularFireModule.initializeApp(environment.firebase, 'my-app')
    AngularFireDatabaseModule,
    AngularFireAuthModule,
  ],
  bootstrap[ App ]
})
export class MyModule { }

@Component({
  selector: 'my-app',
  template: `
    <div> {{ (items | async)? | json }} </div>
    <div> {{ (user | async)? | json }} </div>
    <button (click)="login()">Login</button>
    <button (click)="logout()">Logout</button>
  `
})
export class App {
  user: Observable<firebase.User>;
  items: FirebaseListObservable<any[]>;
  constructor(afAuth: AngularFireAuth, db: AngularFireDatabase) {
    this.user = afAuth.authState;
    this.items = db.list('items');
  }
  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
  logout() {
     this.afAuth.auth.signOut();
  }
}
```
