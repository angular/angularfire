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
import { GoogleAuthProvider } from 'firebase/auth';
import { User } from 'firebase';

@Component({
  selector: 'app-root',
  template: `
  <div> {{ (user | async)?.uid }} </div>
  <button (click)="login()">Login</button>
  <button (click)="logout()">Logout</button>
  `,
})
export class AppComponent {

  user: Observable<User>;

  constructor(public afAuth: AngularFireAuth) {
    this.user = afAuth.authState;
  }

  login() {
    this.afAuth.auth.signInWithPopup(new GoogleAuthProvider());
  }

  logout() {
    this.afAuth.auth.signOut();
  }
}
```

## Cordova case

Firebase authentication wasn't entirely compatible with cordova. You need to add some specific operations.

**Example:**

Login with Facebook.

1. Install the cordova plugin

```bash
cordova plugin add cordova-plugin-facebook4 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication"
```

2. Use `signInWithCredential` method

```ts
console.log("Facebook success: " + JSON.stringify(result));
var provider = firebase.auth.FacebookAuthProvider.credential(result.authResponse.accessToken);

afAuth.auth.signInWithCredential(provider)
  .then((success) => {
    console.log("Firebase success: " + JSON.stringify(success));
  })
  .catch((error) => {
    console.log("Firebase failure: " + JSON.stringify(error));
  });
```
