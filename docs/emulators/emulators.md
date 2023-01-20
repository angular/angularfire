# Connect your app and start prototyping

In this guide, we'll look at how to use `@angular/fire` to connect an Angular application with Firebase Emulator Suite to start prototyping your apps.

There are four supported emulators, all of them available at the Firebase suite workflow:

- [Authentication Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Realtime Database Emulator](https://firebase.google.com/docs/emulator-suite/connect_rtdb)
- [Cloud Firestore Emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Cloud Functions Emulator](https://firebase.google.com/docs/emulator-suite/connect_functions)

**The Auth Emulator only works with Firebase v8 and above, which is supported by `@angular/fire` 6.1.0 or higher**.

Before configuring these emulators at the Angular App, be sure to install the ones you need by following the [Install, configure and integrate Local Emulator Suite](https://firebase.google.com/docs/emulator-suite/install_and_configure) documentation.

_**TL;DR**_

Initialize firebase to your project (if you haven't) by running:

```shell
firebase init
```

Then launch the emulator setup wizard by running:

```shell
firebase init emulators
```

Follow the instructions to download whatever emulator you want to use then checkout that the `firebase.json` file got updated with the default ports per emulator, something like this:

```jsonc
{
  // Existing firebase configuration ...
  // Optional emulator configuration. Default
  // values are used if absent.
  "emulators": {
    "firestore": {
      "port": "8080"
    },
    "ui": {
      "enabled": true, // Default is `true`
      "port": 4000     // If unspecified, see CLI log for selected port
    },
    "auth": {
      "port": "9099"
    },
    "functions": {
      "port": "5001"
    },
    "database": {
      "port": "9000"
    },
    "pubsub": {
      "port": "8085"
    }
  }
}
```

Then launch the emulators by running

```shell
firebase emulators:start
```

Then you can visit 

```shell
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4000/               │
└─────────────────────────────────────────────────────────────┘
```

## Import the DI Tokens at your AppModule

Configuring your app to connect to local emulators is easily done by using dependency injection tokens provided by the library. However, there are slighty changes between 6.0.0 and 6.1.0 in the way it was done.

### 6.1.0 Method

Each module (database, firestore, auth, function) provides `USE_EMULATOR` token to configure the emulator `host` and `port` by passing a tuple of `[string, number]` values, which are set by default to `localhost` and the asigned port from your `firebase.json` file.

Update your `environment.ts` file:

```ts
export const environment = {
  production: false,
  useEmulators: true,
  ...
}

```

Import these tokens at your `app.module.ts` as follow:

```ts
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/compat/auth';
import { USE_EMULATOR as USE_DATABASE_EMULATOR } from '@angular/fire/compat/database';
import { USE_EMULATOR as USE_FIRESTORE_EMULATOR } from '@angular/fire/compat/firestore';
import { USE_EMULATOR as USE_FUNCTIONS_EMULATOR } from '@angular/fire/compat/functions';

@NgModule({
  // ... Existing configuration
  providers: [
    // ... Existing Providers
    { provide: USE_AUTH_EMULATOR, useValue: environment.useEmulators ? ['http://localhost', 9099] : undefined },
    { provide: USE_DATABASE_EMULATOR, useValue: environment.useEmulators ? ['http://localhost', 9000] : undefined },
    { provide: USE_FIRESTORE_EMULATOR, useValue: environment.useEmulators ? ['http://localhost', 8080] : undefined },
    { provide: USE_FUNCTIONS_EMULATOR, useValue: environment.useEmulators ? ['http://localhost', 5001] : undefined },
  ]
})
export class AppModule { }
```

The environment `useEmulators` flag is used to control whenever the app should connect to the emulators, which is usually done in non-production environments.

Also you can opt-in the new way of setting the Cloud Functions [origin](https://firebase.google.com/docs/functions/locations) in Firebase v8 by using the `NEW_ORIGIN_BEHAVIOR` token in conjuction with the already present `ORIGIN` token.

```ts
import { isDevMode, NgModule } from '@angular/core';
import { ORIGIN as FUNCTIONS_ORIGIN, NEW_ORIGIN_BEHAVIOR } from '@angular/fire/compat/functions';

@NgModule({
  // ... Existing configuration
  providers: [
    // ... Existing Providers
    { provide: NEW_ORIGIN_BEHAVIOR, useValue: true },
    { provide: FUNCTIONS_ORIGIN, useFactory: () => isDevMode() ? undefined : location.origin },
  ]
})
export class AppModule { }
```

### 6.0.0 Method

With the exception of the Auth Emulator, the old way of setting the `host` and `port` for each emulator was done using a different set of tokens by passing the entire url path as string.

```ts
import { URL as DATABASE_URL } from '@angular/fire/compat/database';
import { ORIGIN as FUNCTIONS_ORIGIN } from '@angular/fire/compat/functions';
import { SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/compat/firestore';

@NgModule({
  // ... Existing configuration
  providers: [
    {
      provide: DATABASE_URL,
      useValue: environment.useEmulators ? `http://localhost:9000?ns=${environment.firebase.projectId}` : undefined
    },
    { provide: FIRESTORE_SETTINGS, useValue: environment.useEmulators ? { host: 'localhost:8080', ssl: false } : {} },
    { provide: FUNCTIONS_ORIGIN, useFactory: environment.useEmulators ? 'http://localhost:5001' : undefined },
  ]
})
export class AppModule { }
```

For older versions, please upgrade your app to latest version to get the advantages of these new features :rocket: 
