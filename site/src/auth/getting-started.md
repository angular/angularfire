---
title: Getting started
eleventyNavigation:
  key: Getting started
  parent: Auth
---

## Using AngularFireAuth

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
  template: `{%raw%}
    <div *ngIf="auth.user | async as user; else showLogin">
      <h1>Hello {{ user.displayName }}!</h1>
      <button (click)="logout()">Logout</button>
    </div>
    <ng-template #showLogin>
      <p>Please login.</p>
      <button (click)="login()">Login with Google</button>
    </ng-template>
  {%endraw%}`,
})
export class AppComponent {
  constructor(public auth: AngularFireAuth) {
  }
  login() {
    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
  logout() {
    this.auth.signOut();
  }
}
```

## UI Libraries

- FirebaseUI: An open-source JS library for web that provides simple yet customizable UI bindings on top of Firebase SDKs. This is officially maintained by Firebase. Check out the Angular setup guide at [firebaseui-web](https://github.com/firebase/firebaseui-web#getting-started) and [Firebase Docs](https://firebase.google.com/docs/auth/web/firebaseui#angular).
