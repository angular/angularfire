# Upgrading to AngularFire2 4.0

AngularFire2 4.0 is a refactor of the AngularFire2 package which implements
@NgModule, simplifies authentication, and better supports Angular 4.

### Removing `AngularFire` for Modularity

Prior to 4.0, AngularFire2 not take advantage of the Firebase SDK's modularity for tree shaking. The way we fixed this is to remove the `AngularFire` service and break up the library into smaller @NgModules:

* `AngularFireModule`
* `AngularFireDatabaseModule`
* `AngularFireAuthModule`

Rather than inject `AngularFire` you should now inject each module independently:

```typescript
import { AngularFireDatabase } from 'angularfire2/database';

...

constructor(db: AngularFireDatabase) {
  db.list('foo');
}
```

### Simplified Authentication API

In 4.0 we've further cut the complexity of the package by auth module down to a [`firebase.User`](https://firebase.google.com/docs/reference/js/firebase.User) observer to simplify the package.

```typescript
import { AngularFireAuth } from 'angularfire2/auth';

...

user: Observable<firebase.User>;
constructor(afAuth: AngularFireAuth) {
  this.user = afAuth.authState;
}
```

#### Removing pre-configured login

While convenient, the pre-configure login feature added unneeded complexity into our codebase.

In 4.0 you can now trigger login using the Firebase SDK:

```typescript
login() {
  this.afAuth.auth.signInWithPopup(new GoogleAuthProvider());
}
logout() {
  this.afAuth.auth.signOut();
}
```

[See what methods are available to `firebase.auth.Auth` in the Firebase reference guide](https://firebase.google.com/docs/reference/js/firebase.auth.Auth).

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
import { GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { environment } from '../environments/environment';

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
  user: Observable<FirebaseUser>;
  items: FirebaseListObservable<any[]>;
  constructor(afAuth: AngularFireAuth, db: AngularFireDatabase) {
    this.user = afAuth.authState;
    this.items = db.list('items');
  }
  login() {
    this.afAuth.auth.signInWithPopup(new GoogleAuthProvider());
  }
  logout() {
     this.afAuth.auth.signOut();
  }
}
```