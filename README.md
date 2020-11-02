# AngularFire
The official [Angular](https://angular.io/) library for [Firebase](https://firebase.google.com/).

```bash
ng add @angular/fire
```

## What is AngularFire?

- **Observable based** - Use the power of RxJS, Angular, and Firebase.
- **Realtime bindings** - Synchronize data in realtime.
- **Authentication** - Log users in with a variety of providers and monitor authentication state.
- **Offline Data** - Store data offline automatically with AngularFirestore.
- **Server-side Render** - Generate static HTML to boost perceived performance or create static sites.
- **ngrx friendly** - Integrate with ngrx using AngularFire's action based APIs.
- **Manage binary data** - Upload, download, and delete binary files like images, videos, and other blobs.
- **Call server code** - Directly call serverless Cloud Functions with user context automatically passed.
- **Push notifications** - Register and listen for push notifications
- **Modular** - Include only what's needed. No AngularFire package is above 4kb with most under 2kb (gzipped).

## Quickstart

Get your first application up and running by following [our quickstart guide](docs/install-and-setup.md).

## Example use:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
  <ul>
    <li *ngFor="let item of items | async">
      {{ item.name }}
    </li>
  </ul>
  `
})
export class MyApp {
  items: Observable<any[]>;
  constructor(firestore: AngularFirestore) {
    this.items = firestore.collection('items').valueChanges();
  }
}
```

## Resources

[Contributing](CONTRIBUTING.md)

[Stackblitz Template](https://stackblitz.com/edit/angular-fire-start) - Remember to set your Firebase configuration in `app/app.module.ts`.

[Upgrading to v6.0? Check out our guide.](docs/version-6-upgrade.md)

**Having troubles?** Get help on the [Firebase Mailing List](https://groups.google.com/forum/#!forum/firebase-talk) (officially supported), the [Firebase Community Slack](https://firebase.community/) (look for the `#angularfire2` room), [Gitter](https://gitter.im/angular/angularfire2), or [Stack Overflow](https://stackoverflow.com/questions/tagged/angularfire2).

## Developer Guide

### **NEW:** Monitor usage of your application in production

> `AngularFireAnalytics` provides a convient method of interacting with Google Analytics in your Angular application. The provided `ScreenTrackingService` and `UserTrackingService` automatically log events when you're using the Angular Router or Firebase Authentication respectively. [Learn more about Google Analytics](https://firebase.google.com/docs/analytics).

- [Getting started with Google Analytics](docs/analytics/getting-started.md)

### Interacting with your database(s)

Firebase offers two cloud-based, client-accessible database solutions that support realtime data syncing. [Learn about the differences between them in the Firebase Documentation](https://firebase.google.com/docs/firestore/rtdb-vs-firestore).

#### Cloud Firestore

> `AngularFirestore` allows you to work with Cloud Firestore, the new flagship database for mobile app development. It improves on the successes of Realtime Database with a new, more intuitive data model. Cloud Firestore also features richer, faster queries and scales better than Realtime Database.

- [Documents](docs/firestore/documents.md)
- [Collections](docs/firestore/collections.md)
- [Querying Collections](docs/firestore/querying-collections.md)
- [Offline data](docs/firestore/offline-data.md)

#### Realtime Database

> `AngularFireDatabase` allows you to work with the Realtime Database, Firebase's original database. It's an efficient, low-latency solution for mobile apps that require synced states across clients in realtime.

- [Objects](docs/rtdb/objects.md)
- [Lists](docs/rtdb/lists.md)
- [Querying lists](docs/rtdb/querying-lists.md)

### Authenticate users

- [Getting started with Firebase Authentication](docs/auth/getting-started.md)
- [Route users with AngularFire guards](docs/auth/router-guards.md)

### Upload files

- [Getting started with Cloud Storage](docs/storage/storage.md)

### Receive push notifications

- [Getting started with Firebase Messaging](docs/messaging/messaging.md)

### **BETA:** Change behavior and appearance of your application without deploying

> Firebase Remote Config is a cloud service that lets you change the behavior and appearance of your app without requiring users to download an app update. [Learn more about Remote Config](https://firebase.google.com/docs/remote-config).

- [Getting started with Remote Config](docs/remote-config/getting-started.md)

### **NEW:** Monitor your application performance in production

> Firebase Performance Monitoring is a service that helps you to gain insight into the performance characteristics of your iOS, Android, and web apps. [Learn more about Performance Monitoring](https://firebase.google.com/docs/perf-mon).

- [Getting started with Performance Monitoring](docs/performance/getting-started.md)

### Directly call Cloud Functions

- [Getting started with Callable Functions](docs/functions/functions.md)

### Deploying your application

> Firebase Hosting is production-grade web content hosting for developers. With Hosting, you can quickly and easily deploy web apps and static content to a global content delivery network (CDN) with a single command.

- [Deploy your application on Firebase Hosting](docs/deploy/getting-started.md)

#### Server-side rendering

> Angular Universal is a technology that allows you to run your Angular application on a server. This allows you to generate your HTML in a process called server-side rendering (SSR). Angularfire is compatible with server-side rendering; allowing you to take advantage of the Search Engine Optimization, link previews, the performance gains granted by the technology, and more. [Learn more about Angular Universal](https://angular.io/guide/universal).

- [Getting started with Angular Universal](docs/universal/getting-started.md)
- [Deploying your Universal application on Cloud Functions for Firebase](docs/universal/cloud-functions.md)
- [Prerendering your Universal application](docs/universal/prerendering.md)

### Ionic

- [Installation and Setup with Ionic CLI](docs/ionic/cli.md)
- [Using AngularFire with Ionic 2](docs/ionic/v2.md)
- [Using AngularFire with Ionic 3](docs/ionic/v3.md)
