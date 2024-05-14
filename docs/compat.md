# AngularFire
The official [Angular](https://angular.io/) library for [Firebase](https://firebase.google.com/).

<strong><pre>ng add @angular/fire</pre></strong>

## Compatibility Developer Guide

AngularFire has a new tree-shakable API, you're looking at the documentation for the compatability version of the library. [Find the new developer guide here](../README.md#developer-guide).

[See the v7 upgrade guide for more information on this change.](version-7-upgrade.md).

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
