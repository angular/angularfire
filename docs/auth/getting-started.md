# 5. Getting started with Firebase Authentication

`AngularFireAuth.user` provides you an `Observable<User|null>` to monitor your application's authentication State.

`AngularFireAuth` promise proxies an initialized
`firebase.auth.Auth` instance, allowing you to log users in, out, etc. [See
the Firebase docs for more information on what methods are available.](https://firebase.google.com/docs/reference/js/auth.auth)

**Example app:**

```ts
import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';

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
    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }
  logout() {
    this.auth.signOut();
  }
}
```

## Configuration with Dependency Injection

The AngularFireAuth Module provides several DI tokens to further configure your
authentication process.

### Configure 

Using the `SETTINGS` DI Token (*default: null*), we can set the current Auth
instance's settings. This is used to edit/read configuration related options
like app verification mode for phone authentication, which is useful for
[testing](https://cloud.google.com/identity-platform/docs/test-phone-numbers).

```ts
import { SETTINGS as AUTH_SETTINGS } from '@angular/fire/compat/auth';

@NgModule({
  // ... Existing configuration
  providers: [
    // ... Existing Providers
    { provide: AUTH_SETTINGS, useValue: { appVerificationDisabledForTesting: true } },
  ]
})
export class AppModule { }
```

Read more at [Firebase Auth Settings](https://firebase.google.com/docs/reference/js/auth.authsettings).

### Use Current Browser Language

Using the `USE_DEVICE_LANGUAGE` DI Token (*default: null*), which is a boolean
that allow you to set the current language to the default device/browser
preference. This allows to localize emails but be aware that this only applies
if you use the standard template provided by Firebase. 

```ts
import { USE_DEVICE_LANGUAGE } from '@angular/fire/compat/auth';

@NgModule({
  // ... Existing configuration
  providers: [
    // ... Existing Providers
    { provide: USE_DEVICE_LANGUAGE, useValue: true },
  ]
})
export class AppModule { }
```

If you want to set a different language, you can use `LANGUAGE_CODE` DI Token
(*default: null*).

More info at the [firebase auth docs](https://firebase.google.com/docs/reference/js/auth.auth#authlanguagecode).

```ts
import { LANGUAGE_CODE } from '@angular/fire/compat/auth';

@NgModule({
  // ... Existing configuration
  providers: [
    // ... Existing Providers
    { provide: LANGUAGE_CODE, useValue: 'fr' },
  ]
})
export class AppModule { }
```

### Persistence

Firebase Auth default behavior is to persist a user's session even after the
user closes the browser. To change the current type of persistence on the
current Auth instance for the currently saved Auth session and apply this type
of persistence for future sign-in requests, including sign-in with redirect
requests, you can use the `PERSISTENCE` DI Token (*default: null*).

The possible types are `'local'`, `'session'` or `'none'`. Read more at 
[authentication state persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence).

```ts
import { PERSISTENCE } from '@angular/fire/compat/auth';

@NgModule({
  // ... Existing configuration
  providers: [
    // ... Existing Providers
    { provide: PERSISTENCE, useValue: 'session' },
  ]
})
export class AppModule { }
```

### Tenant

If you need to use multi-tenancy, you can set the current Auth instance's tenant
ID using `TENANT_ID` DI Token (*default: null*).

More tutorials regarding this topic are _coming soon_.

```ts
import { TENANT_ID } from '@angular/fire/compat/auth';

@NgModule({
  // ... Existing configuration
  providers: [
    // ... Existing Providers
    { provide: TENANT_ID, useValue: 'tenant-id-app-one' },
  ]
})
export class AppModule { }
```

- [Multi-Tenancy Authentication](https://cloud.google.com/identity-platform/docs/multi-tenancy-authentication)
- [Firebase Auth Tenant](https://firebase.google.com/docs/reference/js/auth.auth#tenantid)

## UI Libraries

- Material Design : [ngx-auth-firebaseui](https://github.com/AnthonyNahas/ngx-auth-firebaseui)
- Bootstrap : [@firebaseui/ng-bootstrap](https://github.com/firebaseui/ng-bootstrap)

## Cordova

Learn how to [setup Firebase Authentication with Cordova](https://firebase.google.com/docs/auth/web/cordova) in the Firebase Guides.
