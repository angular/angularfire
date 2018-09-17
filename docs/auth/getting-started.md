# 5. Getting started with Firebase Authentication

`AngularFireAuth.user` provides you an `Observable<User|null>` to monitor your application's authentication State.

`AngularFireAuth.auth` returns an initialized
`firebase.auth.Auth` instance, allowing you to log users in, out, etc. [See
the Firebase docs for more information on what methods are available.](https://firebase.google.com/docs/reference/js/firebase.auth.Auth)

**Example app:**

```ts
import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="afAuth.user | async as user; else showLogin">
      <h1>Hello {{ user.displayName }}!</h1>
      <button (click)="logout()">Logout</button>
    </div>
    <ng-template #showLogin>
      <p>Please login.</p>
      <button (click)="login()">Login with Google</button>
    </ng-template>
  `,
})
export class AppComponent {
  constructor(public afAuth: AngularFireAuth) {
  }
  login() {
    this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }
  logout() {
    this.afAuth.auth.signOut();
  }
}
```

## Cordova

Learn how to [setup Firebase Authentication with Cordova](https://firebase.google.com/docs/auth/web/cordova) in the Firebase Guides.
