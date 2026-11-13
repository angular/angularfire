# AngularFire
The official [Angular](https://angular.dev/) library for [Firebase](https://firebase.google.com/).

<strong><pre>ng add @angular/fire</pre></strong>

## Compatibility Developer Guide

AngularFire has a new tree-shakable API, you're looking at the documentation for the compatability version of the library. [Find the new developer guide here](../README.md#developer-guide).

[See the v7 upgrade guide for more information on this change.](version-7-upgrade.md).

### Support status

The compatibility API (`@angular/fire/compat/*`) is still supported. It gets bug fixes but no new features, which go into the modular API only. There are no plans to remove it, so you can keep upgrading AngularFire without migrating.

Some of its tests are turned off right now: the ones for `AngularFirestoreCollection`, `AngularFirestoreCollectionGroup` and `AngularFirestoreDocument`, and one Cloud Storage upload test. Until [#3822](https://github.com/angular/angularfire/issues/3822) turns them back on, a bug in those APIs may not be caught before a release, so please report any you find.

### Setup

Install AngularFire and Firebase with `ng add @angular/fire`, as in [the quickstart](install-and-setup.md#2-install-angularfire-and-firebase) (its "Before you begin" notes apply here too), or with `npm install @angular/fire firebase`.

At the `ng add` feature prompt, select the products you use: `ng add` then writes the modular providers (`provideFirebaseApp(...)` and one per selected feature) into your app configuration with your Firebase configuration inlined, and with nothing selected it installs the packages and sets up nothing.

The compat API does not use the modular providers. It needs `AngularFireModule.initializeApp(...)` with your Firebase configuration, plus the compat module of each Firebase product you use.

The modular providers can stay if `AngularFireModule.initializeApp(...)` gets the same configuration object, both APIs then share one Firebase app. With two different configurations, whichever API starts second fails with `app/duplicate-app`.

In a standalone application, add them to `app.config.ts`:

```ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      AngularFireModule.initializeApp({ /* your Firebase configuration */ }),
      AngularFireDatabaseModule,
    ),
  ],
};
```

In an NgModule application, import them in `app-module.ts`:

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { App } from './app';

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp({ /* your Firebase configuration */ }),
    AngularFireDatabaseModule,
  ],
  bootstrap: [App],
})
export class AppModule {}
```

Without `AngularFireModule.initializeApp(...)`, injecting a compat service fails with `NG0201`, which a development build reports as:

```
NG0201: No provider found for `InjectionToken angularfire2.app.options`.
```

The compat module for each product:

| Product | Module | Import from |
|---|---|---|
| Analytics | `AngularFireAnalyticsModule` | `@angular/fire/compat/analytics` |
| Authentication | `AngularFireAuthModule` | `@angular/fire/compat/auth` |
| Authentication route guards | `AngularFireAuthGuardModule` | `@angular/fire/compat/auth-guard` |
| Cloud Firestore | `AngularFirestoreModule` | `@angular/fire/compat/firestore` |
| Cloud Functions | `AngularFireFunctionsModule` | `@angular/fire/compat/functions` |
| Cloud Messaging | `AngularFireMessagingModule` | `@angular/fire/compat/messaging` |
| Cloud Storage | `AngularFireStorageModule` | `@angular/fire/compat/storage` |
| Performance Monitoring | `AngularFirePerformanceModule` | `@angular/fire/compat/performance` |
| Realtime Database | `AngularFireDatabaseModule` | `@angular/fire/compat/database` |
| Remote Config | `AngularFireRemoteConfigModule` | `@angular/fire/compat/remote-config` |

### Monitor usage of your application in production

> `AngularFireAnalytics` provides a convenient method of interacting with Google Analytics in your Angular application. The provided `ScreenTrackingService` and `UserTrackingService` automatically log events when you're using the Angular Router or Firebase Authentication respectively. [Learn more about Google Analytics](https://firebase.google.com/docs/analytics).

- [Getting started with Google Analytics](compat/analytics/getting-started.md)

### Interacting with your database(s)

Firebase offers two cloud-based, client-accessible database solutions that support realtime data syncing. [Learn about the differences between them in the Firebase Documentation](https://firebase.google.com/docs/firestore/rtdb-vs-firestore).

#### Cloud Firestore

> `AngularFirestore` allows you to work with Cloud Firestore, the new flagship database for mobile app development. It improves on the successes of Realtime Database with a new, more intuitive data model. Cloud Firestore also features richer, faster queries and scales better than Realtime Database.

- [Documents](compat/firestore/documents.md)
- [Collections](compat/firestore/collections.md)
- [Querying Collections](compat/firestore/querying-collections.md)
- [Offline data](compat/firestore/offline-data.md)

#### Realtime Database

> `AngularFireDatabase` allows you to work with the Realtime Database, Firebase's original database. It's an efficient, low-latency solution for mobile apps that require synced states across clients in realtime.

- [Objects](compat/rtdb/objects.md)
- [Lists](compat/rtdb/lists.md)
- [Querying lists](compat/rtdb/querying-lists.md)

### Authenticate users

- [Getting started with Firebase Authentication](compat/auth/getting-started.md)
- [Route users with AngularFire guards](compat/auth/router-guards.md)

### Local Emulator Suite

- [Getting started with Firebase Emulator Suite](compat/emulators/emulators.md)

### Upload files

- [Getting started with Cloud Storage](compat/storage/storage.md)

### Receive push notifications

- [Getting started with Firebase Messaging](compat/messaging/messaging.md)

### **BETA:** Change behavior and appearance of your application without deploying

> Firebase Remote Config is a cloud service that lets you change the behavior and appearance of your app without requiring users to download an app update. [Learn more about Remote Config](https://firebase.google.com/docs/remote-config).

- [Getting started with Remote Config](compat/remote-config/getting-started.md)

### Monitor your application performance in production

> Firebase Performance Monitoring is a service that helps you to gain insight into the performance characteristics of your iOS, Android, and web apps. [Learn more about Performance Monitoring](https://firebase.google.com/docs/perf-mon).

- [Getting started with Performance Monitoring](compat/performance/getting-started.md)

### Directly call Cloud Functions

- [Getting started with Callable Functions](compat/functions/functions.md)
