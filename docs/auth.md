<img align="right" width="30%" src="images/auth-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Authentication
</small>

# Authentication

Most apps need to know the identity of a user. Knowing a user's identity allows an app to securely save user data in the cloud and provide the same personalized experience across all of the user's devices.
Firebase Authentication provides backend services, easy-to-use SDKs, and ready-made UI libraries to authenticate users to your app. It supports authentication using passwords, phone numbers, popular federated identity providers like Google, Facebook and Twitter, and more.

Firebase Authentication integrates tightly with other Firebase services, and it leverages industry standards like OAuth 2.0 and OpenID Connect, so it can be easily integrated with your custom backend.

[Learn more about Firebase Authentication](https://firebase.google.com/docs/auth)

# 5. Getting started with Firebase Authentication

#### This documentation works for Modular Firebase V9+

First initialize firebase authentication in `app.module.ts`

```typescript
@NgModule({
  declarations: [AppComponent],
  imports: [provideAuth(() => getAuth())],
  providers: [ScreenTrackingService, UserTrackingService],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

#### A basic authentication demo code.

```typescript
import { Component } from "@angular/core";
import {
  Auth,
  authState,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential,
} from "@angular/fire/auth";
import { map } from "rxjs";
@Component({
  selector: "app-root",
  template: `
    <div *ngIf="loggedIn">
      <h1>Hello {{ user.displayName }}!</h1>
      <button (click)="logout()">Logout</button>
    </div>

    <div *ngIf="!loggedIn">
      <p>Please login.</p>
      <button (click)="login()">Login with Google</button>
    </div>
  `,
})
export class AppComponent {
  title = "AngularFireDevelopment";
  user: any;
  public loggedIn: boolean = false;
  constructor(private auth: Auth) {
    authState(this.auth)
      .pipe(map((u) => u))
      .subscribe((userData) => {
        this.user = userData;
        this.loggedIn = !!userData;
      });
  }
  login() {
    signInWithPopup(this.auth, new GoogleAuthProvider()).then(
      async (credentials: UserCredential) => {
        this.user = credentials.user;
      }
    );
  }
  logout() {
    return signOut(this.auth);
  }
}
```

It is a good practice to keep your local code away from component code. So let's create a service file inside our

`ng generate service services/authentication/authentication`

It should create a file like this. This file is known as service.
[More on services here.](https://angular.io/tutorial/toh-pt4)

![Directory Strucutre](AuthServiceDireStructure.png)

Now add these functions in your services

This is for logging in with google.

```typescript
googleLogin(){
    signInWithPopup(this.auth, new GoogleAuthProvider()).then(
      async (credentials: UserCredential) => {
        this.user = credentials.user;
      }
    );
  }
```

This is for logging in with email and password it takes two arguments email and password.

```typescript
emailLogin(email:string,password:string){
    return signInWithEmailAndPassword(this.auth,email,password)
  }
```

This is for creating account with an email and password

#### Please verify and check for all password requirements using form validation firebase does not qualifications for secure password and valid emails.

```typescript
emailSignup(email:string,password:string){
    return createUserWithEmailAndPassword(this.auth,email,password)
  }
```

This method logs you out of any or all account for current user instance

```typescript
logout() {
    return signOut(this.auth);
  }
```

This methods signs you in anonymously.

```typescript
anonymousSignIn(){
    return signInAnonymously(this.auth);
  }
```

#### The final service file

`authentication.service.ts`

```typescript
import { Injectable } from "@angular/core";
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential,
} from "@angular/fire/auth";
import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
} from "firebase/auth";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  user: any;
  constructor(private auth: Auth) {}
  googleLogin() {
    signInWithPopup(this.auth, new GoogleAuthProvider()).then(
      async (credentials: UserCredential) => {
        this.user = credentials.user;
      }
    );
  }
  emailLogin(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
  emailSignup(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }
  logout() {
    return signOut(this.auth);
  }
  anonymousSignIn() {
    return signInAnonymously(this.auth);
  }
}
```

Now in your `app.component.ts` add this code to immport our `AuthenticationService` file we just created.

`app.component.ts`

```typescript
import { Component } from "@angular/core";
import {
  FormControl,
  FormControlName,
  FormGroup,
  Validators,
} from "@angular/forms";
import { AuthenticationService } from "./services/authentication/authentication.service";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "AngularFireDevelopment";
  constructor(public authService: AuthenticationService) {}
  signIn: FormGroup = new FormGroup({
    email: new FormControl("", [Validators.required]),
    password: new FormControl("", [Validators.required]),
  });
  signUp: FormGroup = new FormGroup({
    email: new FormControl("", [Validators.required]),
    password: new FormControl("", [Validators.required]),
  });
  login() {
    if (this.signIn.valid) {
      this.authService
        .emailLogin(this.signIn.value.email, this.signIn.value.password)
        .then(() => alert("Signed In"))
        .catch((error) => alert("Invalid Sign In" + error.toString()));
    } else {
      alert("Invalid Login Form");
    }
  }
  signup() {
    if (this.signUp.valid) {
      this.authService
        .emailSignup(this.signUp.value.email, this.signUp.value.password)
        .then(() => alert("Signed up"))
        .catch((error: any) => alert("Invalid Sign Up" + error.toString()));
    } else {
      alert("Invalid Signup Form");
    }
  }
}
```

Now add `FormsModule` and `ReactiveFormsModule` to your app module imports.

```typescript
imports: [FormsModule, ReactiveFormsModule];
```

And your `app.component.html` file which will have only UI code but will be able to access the authentication service using Injection

`app.component.html`

```html
<div *ngIf="authService.loggedIn">
  <h1>Hello {{ authService.user.displayName }}!</h1>
  <button (click)="authService.logout()">Logout</button>
</div>

<div *ngIf="!authService.loggedIn">
  <p>Please login.</p>
  <button (click)="authService.googleLogin()">Login with Google</button>
  <div>
    <form [formGroup]="signIn">
      <input type="text" formControlName="email" placeholder="Email" />
      <input type="text" formControlName="password" placeholder="Password" />
      <button (click)="login()">Login with Email And Password</button>
    </form>
  </div>
  <div>
    <form [formGroup]="signUp">
      <input type="text" formControlName="email" placeholder="Email" />
      <input type="text" formControlName="password" placeholder="Password" />
      <button (click)="signup()">Signup with Email And Password</button>
    </form>
  </div>
</div>
```

### Now you just learned how to do authentication with firebase.

---

[Google Docs Reference](https://firebase.google.com/docs/auth/web/auth-state-persistence)
# Authentication state persistance
Authentication State Persistence

You can specify how the Authentication state persists when using the Angular Fire SDK. This includes the ability to specify whether a signed in user should be indefinitely persisted until explicit sign out, cleared when the window is closed or cleared on page reload.

For a web application, the default behavior is to persist a user's session even after the user closes the browser. This is convenient as the user is not required to continuously sign-in every time the web page is visited on the same device. This could require the user having to re-enter their password, send an SMS verification, etc, which could add a lot of friction to the user experience.

However, there are cases where this behavior may not be ideal:

* Applications with sensitive data may want to clear the state when the window or tab is closed. This is important in case the user forgets to sign out.
* Applications that are used on a device shared by multiple users. A common example here is an app running in a library computer.

* An application on a shared device that might be accessed by multiple users. The developer is unable to tell how that application is accessed and may want to provide a user with the ability to choose whether to persist their session or not. This could be done by adding a "Remember me" option during sign-in.

* In some situations, a developer may want to not persist an anonymous user until that user is upgraded to a non-anonymous account (federated, password, phone, etc.).

* A developer may want to allow different users to sign in to an application on different tabs. The default behavior is to persist the state across tabs for the same origin.

As stated above, there are multiple situations where the default permanent persistence may need to be overridden.

>Note: Do not confuse Auth state persistence with Firestore offline data persistence. Auth state persistence specifies how a user session is persisted on a device. Whereas Firestore enablePersistence enables Cloud Firestore data caching when the device is offline.

# Overview of persistence behavior
You can specify or modify the existing type of persistence by calling the `setPersistence()` method.
The two parameters of this functions are:
1. authInstance: Instance of the initliazed auth by using `getAuth()` method.
2. persistance: A valid persistance type imported from auth module.

##### Types of Persistence.
* 'browserSessionPersistence' is used for persistence such as `sessionStorage`.
* 'indexedDBLocalPersistence' or 'browserLocalPersistence' used for long term persistence such as `localStorage` `IndexedDB`.
* 'inMemoryPersistence' is used for in-memory, or persistence.


### The following criteria will be applied when determining the current state of persistence.
Initially, the SDK will check if an authenticated user exists. Unless setPersistence is called, that user's current persistence type will be applied for future sign-in attempts. So if that user was persisted in session on a previous web page and a new page was visited, signing in again with a different user will result in that user's state being also saved with session persistence.

If no user is signed in and no persistence is specified, the default setting will be applied (local in a browser app).
If no user is signed in and a new type of persistence is set, any future sign-in attempt will use that type of persistence.
If the user is signed in and persistence type is modified, that existing signed in user will change persistence to the new one. All future sign-in attempts will use that new persistence.

When signInWithRedirect is called, the current persistence type is retained and applied at the end of the OAuth flow to the newly signed in user, even if the persistence was none. If the persistence is explicitly specified on that page, it will override the retained auth state persistence from the previous page that started the redirect flow.

Add this in `app.module.ts` imports array.

```typescript
imports: [
  provideAuth(() => {
    const auth = getAuth();
    setPersistence(auth, inMemoryPersistence);
    // setPersistence(auth, inMemoryPersistence);
    // setPersistence(auth,browserLocalPersistence)
    // setPersistence(auth, indexedDBLocalPersistence);
    // setPersistence(auth, browserSessionPersistence);
    return auth;
  }),
];
```

## Configuration with Dependency Injection and Inbuilt Functions
The AngularFireAuth Module provides several from which you can configure the authentication process.


### Use Current Browser Language

Using the `useDeviceLanguage()` method that allow you to set the current language to the default device/browser
preference. This allows to localize emails but be aware that this only applies
if you use the standard template provided by Firebase.

```ts
import { useDeviceLanguage } from "@angular/fire/auth";

@NgModule({
  provideAuth(()=>{
      const auth = getAuth();
      useDeviceLanguage(auth);
      return auth;
    }),
})
export class AppModule {}
```

If you want to set a different language, you can use `languageCode` property of Auth instance.

More info at the [firebase auth docs](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#languagecode).

```ts

@NgModule({
  provideAuth(()=>{
      const auth = getAuth();
      auth.languageCode = 'fr';
      return auth;
    }),
})
export class AppModule {}
```
### Tenant

If you need to use multi-tenancy, you can set the current Auth instance's tenant
ID using `tenantId` property from Auth instance.

More tutorials regarding this topic are _coming soon_.

```ts

@NgModule({
  provideAuth(()=>{
      const auth = getAuth();
      auth.tenantId = "tenant-id-app-one"
      return auth;
    }),
})
export class AppModule {}
```

- [Multi-Tenancy Authentication](https://cloud.google.com/identity-platform/docs/multi-tenancy-authentication)
- [Firebase Auth Tenant](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#tenantid)


### Configure

Using the `SETTINGS` DI Token (_default: null_), we can set the current Auth
instance's settings. This is used to edit/read configuration related options
like app verification mode for phone authentication, which is useful for
[testing](https://cloud.google.com/identity-platform/docs/test-phone-numbers).

```ts
import { SETTINGS as AUTH_SETTINGS } from "@angular/fire/compat/auth";

@NgModule({
  // ... Existing configuration
  providers: [
    // ... Existing Providers
    {
      provide: AUTH_SETTINGS,
      useValue: { appVerificationDisabledForTesting: true },
    },
  ],
})
export class AppModule {}
```

Read more at [Firebase Auth Settings](https://firebase.google.com/docs/reference/js/firebase.auth.AuthSettings).

## UI Libraries

- Material Design : [ngx-auth-firebaseui](https://github.com/AnthonyNahas/ngx-auth-firebaseui)
- Bootstrap : [@firebaseui/ng-bootstrap](https://github.com/firebaseui/ng-bootstrap)

## Cordova

Learn how to [setup Firebase Authentication with Cordova](https://firebase.google.com/docs/auth/web/cordova) in the Firebase Guides.


## Connecting the the emulator suite

```ts
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';

@NgModule({
  imports: [
    provideAuth(() => {
      const auth = getAuth();
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      return auth;
    }),
  ]
})
```
