# 5. User authentication

> AngularFire2 allows you configure your authentication methods in the bootstrap
phase of your application. This means that if your app only uses one form
of authentication, you can specify that ahead of time so you only need to call
`af.auth.login()` later, and with no parameters.

## Configure application in bootstrap

To specify your authentication ahead of time, you provide the `AngularFireModule.initializeApp` function 
with an `AuthProvider` and an `AuthMethod`.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule, AuthProviders, AuthMethods } from 'angularfire2';

const myFirebaseConfig = {
  apiKey: '<your-key>',
  authDomain: '<your-project-authdomain>',
  databaseURL: '<your-database-URL>',
  storageBucket: '<your-storage-bucket>',
}

const myFirebaseAuthConfig = {
  provider: AuthProviders.Google,
  method: AuthMethods.Redirect
}

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(myFirebaseConfig, myFirebaseAuthConfig)
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```


## Login users

If you have setup authentication in bootstrap like above, then all you need to do
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
  selector: 'app-root',
  template: `
  <div> {{ (af.auth | async)?.uid }} </div>
  <button (click)="login()">Login</button>
  <button (click)="logout()">Logout</button>
  `,
})
export class AppComponent {
  constructor(public af: AngularFire) {}
 
 login() {
    this.af.auth.login();
  }
  
  logout() {
     this.af.auth.logout();
  }
}
```

## Logout users

Deletes the authentication token issued by Firebase and signs user out. See [Auth.signOut()](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#signOut) in the Firebase API reference.

Sample Usage:

```ts
	signOut(): {
		this.af.auth.logout();
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
  email: 'email@example.com',
  password: 'password',
},
{
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

*Before running the below example, make sure you've correctly enabled the appropriate sign-in providers in your Firebase console under Auth tab to avoid any exceptions.*

```ts
import { Component } from '@angular/core';
import { AngularFire, AuthProviders, AuthMethods } from 'angularfire2';

@Component({
  selector: 'app-root',
  template: `
  <div> {{ (af.auth | async)?.uid }} </div>
  <button (click)="login()">Login With Twitter</button>
  <button (click)="overrideLogin()">Login Anonymously</button>
  `,
})
export class AppComponent {
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
