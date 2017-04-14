# 5. User authentication

> AngularFire2 provides you an Observable for your Firebase Authentication
State via the `AngularFireAuth` module.

AngularFireAuth's `.auth` object will return an initialized
`firebase.auth.Auth` instance, allowing you to log users in and out. [See
the Firebase docs for more information on what methods are availabile.](https://firebase.google.com/docs/reference/js/firebase.auth.Auth)

**Example app:**

```ts
import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import { GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';

@Component({
  selector: 'app-root',
  template: `
  <div> {{ (user | async)?.uid }} </div>
  <button (click)="login()">Login</button>
  <button (click)="logout()">Logout</button>
  `,
})
export class AppComponent {

  user: Observable<FirebaseUser>;

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

1- Install cordova plugin

```cordova plugin add cordova-plugin-facebook4 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication"```

2- Use signInWithCredential login method

```ts
  console.log("Facebook success: " + JSON.stringify(result));
  var provider = firebase.auth.FacebookAuthProvider.credential(result.authResponse.accessToken);

   firebase.auth().signInWithCredential(provider)
    .then((success) => {
      console.log("Firebase success: " + JSON.stringify(success));
    })
    .catch((error) => {
      console.log("Firebase failure: " + JSON.stringify(error));
    });
```
