# Upgrading to AngularFire2 4.0

AngularFire2 4.0 is a refactor of the AngularFire2 package which implements
@NgModule, simplifies authentication, and better supports Angular 4.

The proposal was introduced by David East in [Release Candidate API proposal
#854](https://github.com/angular/angularfire2/issues/854).

### Removing `AngularFire` for Modularity

AngularFire2 does not take advantage of the Firebase SDK's modularity. Users who only need authentication receive database code and vice versa. The `AngularFire` service is a central part of this problem. The class includes each feature whether you are using it or not. Even worse, this cannot be tree-shaken. As the library grows to include more features, this will only become more of a problem.

The way to fix this is to remove the `AngularFire` service and break up the library into smaller @NgModules.

* `AngularFireModule`
* `AngularFireDatabaseModule`
* `AngularFireAuthModule`

### Simplified Authentication API

The goal of AngularFire is not to wrap the Firebase SDK. **The goal is to provide Angular-specific functionality.**

To this effect, we've cut the auth module down to an obverser for state changes.

Most of the custom authentication methods were simply wrapper calls around the official SDK. Rather than creating more bytes for no value, the Firebase Auth instance is available as a property named `auth` where the same functionality exists.

### Removing pre-configured login

While convenient, the pre-configure login feature added unneeded complexity into our codebase. You can now trigger login as expected with the Firebase SDK.

### FirebaseListFactory and FirebaseObjectFactory API Changes

This change only affects a few users who directly use `FirebaseListFactory`. Most people inject `AngularFireDatabase` directly or use the `AngularFire` service.

If you directly use `FirebaseListFactory` you will no longer be able to pass in a string. **The `AngularFireDatabase` module will still take paths for .list() and .object().** With the `FirebaseApp` now easily injectable, you can create a reference while still adhering to DI.

This is a minor change, but again it prioritizes simplicity. It keeps the library from writing check logic at multiple abstractions. This again reduces complexity and maintenance.

## Putting this all together

Here's an example of what AngularFire2 4.0 looks like:

```
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