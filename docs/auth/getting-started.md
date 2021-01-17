# 5. Getting started with Firebase Authentication

`AngularFireAuth.user` provides you an `Observable<User|null>` to monitor your application's authentication State.

`AngularFireAuth` promise proxies an initialized
`firebase.auth.Auth` instance, allowing you to log users in, out, etc. [See
the Firebase docs for more information on what methods are available.](https://firebase.google.com/docs/reference/js/firebase.auth.Auth)

**Example app:**

```ts
import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="auth.user | async as user; else showLogin">
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
  constructor(public auth: AngularFireAuth) {
  }
  login() {
    this.auth.signInWithPopup(new firebase.default.auth.GoogleAuthProvider());
  }
  logout() {
    this.auth.signOut();
  }
}
```

## UI Libraries

- Material Design : [ngx-auth-firebaseui](https://github.com/AnthonyNahas/ngx-auth-firebaseui)
- Bootstrap : [@firebaseui/ng-bootstrap](https://github.com/firebaseui/ng-bootstrap)

## Cordova

Learn how to [setup Firebase Authentication with Cordova](https://firebase.google.com/docs/auth/web/cordova) in the Firebase Guides.
