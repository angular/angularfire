# 5. User authentication

`AngularFireAuth.authState` provides you an `Observable<firebase.User>` to monitor your application's authentication State.

`AngularFireAuth.auth` returns an initialized
`firebase.auth.Auth` instance, allowing you to log users in, out, etc. [See
the Firebase docs for more information on what methods are availabile.](https://firebase.google.com/docs/reference/js/firebase.auth.Auth)

**Example app:**

```ts
import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-root',
  template: `
  <div> {{ (user | async)?.uid }} </div>
  <button (click)="login()">Login</button>
  <button (click)="logout()">Logout</button>
  `,
})
export class AppComponent {

  user: Observable<firebase.User>;

  constructor(public afAuth: AngularFireAuth) {
    this.user = afAuth.authState;
  }

  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  logout() {
    this.afAuth.auth.signOut();
  }
}
```

## Cordova

Learn how to [setup Firebase Authentication with Cordova](https://firebase.google.com/docs/auth/web/cordova) in the Firebase Guides.
