# 5. User authentication

> AngularFire2 allows you configure your authentication methods in the bootstrap
phase of your application. This means that if your app only uses one form
of authentication, you can specify that ahead of time so you only need to call
`af.auth.login()` later, and with no parameters.

## Configure application in bootstrap

To specify your authentication ahead of time, you provide the `bootstrap` array 
with the `firebaseAuthConfig` service. 

The `firebaseAuthConfig` services takes in an `AuthProvider` and an `AuthMethod`.

```ts
bootstrap(<MyApp>Component, [
  FIREBASE_PROVIDERS,
  defaultFirebase({
    apiKey: "<your-key>",
    authDomain: "<your-project-authdomain>",
    databaseURL: "<your-database-URL>",
    storageBucket: "<your-storage-bucket>",
  }),
  firebaseAuthConfig({
    provider: AuthProviders.Google,
    method: AuthMethods.Redirect
  })
]);
```

**Example bootstrap**
```ts
import { bootstrap } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { <MyApp>Component, environment } from './app/';
import {FIREBASE_PROVIDERS, 
  defaultFirebase, 
  AngularFire, 
  AuthMethods, 
  AuthProviders, 
  firebaseAuthConfig} from 'angularfire2';

if (environment.production) {
  enableProdMode();
}

bootstrap(<MyApp>Component, [
  FIREBASE_PROVIDERS,
  defaultFirebase({
   // config object 
  }),
  firebaseAuthConfig({
    provider: AuthProviders.Twitter,
    method: AuthMethods.Redirect
  })
]);
```

## Login users

If you have setup authentication in boostrap like above, then all you need to do
is call login on `af.auth.login()`

The long exception is if you're using username and password, then you'll have
to call `af.auth.login()` with the user's credentials.

```ts
af.auth.login({ email: 'email', password: 'pass' });
```

**Example app:**

```ts
import { Component } from '@angular/core';
import { AngularFire } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: 'app',
  template: `
  <div> {{ (af.auth | async).uid }} </div>
  <button (click)="login()">Login</button>
  `,
})
export class RcTestAppComponent {
  constructor(public af: AngularFire) {}
  login() {
    this.af.auth.login();
  }
}
```

## Override configuration / No config

Authentication works without configuration, and even if you have setup 
authentication in the boostrap phase, you can still override the configuration.

```ts
// Anonymous
af.auth.login({
  provider: AuthProviders.Anonymous,
  method: AuthMethods.Anonymous,
})

// Email and password
af.auth.login({
  provider: AuthProviders.Password,
  method: AuthMethods.Password,
})

// Social provider redirect
af.auth.login({
  provider: AuthProviders.Twitter,
  method: AuthMethods.Redirect,
})

// Social provider popup
af.auth.login({
  provider: AuthProviders.Github,
  method: AuthMethods.Popup,
})
```

**Example app:**

```ts
import { Component } from '@angular/core';
import { AngularFire, AuthProviders, AuthMethods } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: 'app',
  template: `
  <div> {{ (af.auth | async)?.uid }} </div>
  <button (click)="login()">Login With Twitter</button>
  <button (click)="overrideLogin()">Login Anonymously</button>
  `,
})
export class RcTestAppComponent {
  constructor(public af: AngularFire) {
    this.af.auth.subscribe(auth => console.log(auth));
  }
  login() {
    this.af.auth.login({
      provider: AuthProviders.Twitter,
      method: AuthMethods.Popup,
    });
  }
  overrideLogin() {
    this.af.auth.login({
      provider: AuthProviders.Anonymous,
      method: AuthMethods.Anonymous,
    });    
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
