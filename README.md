<p align="center">
  <h1 align="center">AngularFire</h1>
  <p align="center">The official library for Firebase and Angular</p>
</p>

[![Build Status](https://travis-ci.org/angular/angularfire2.svg?branch=master)](https://travis-ci.org/angular/angularfire2) [![Join the chat at https://gitter.im/angular/angularfire2](https://badges.gitter.im/angular/angularfire2.svg)](https://gitter.im/angular/angularfire2?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## What is AngularFire?

- **Observable based** - Use the power of RxJS, Angular, and Firebase.
- **Realtime bindings** - Synchronize data in realtime.
- **Authentication** - Log users in with a variety of providers and monitor authentication state in realtime.
- **Offline Data** - Store data offline automatically with AngularFirestore.
- **Server-side Render** - Generate static HTML to boost perceived performance or create static sites.
- **ngrx friendly** - Integrate with ngrx using AngularFire's action based APIs.
- **Manage binary data** - Upload, download, and delete binary files like images, videos, and other blobs.
- **Call server code** - Directly call serverless Cloud Functions with user context automatically passed.
- **Push notifications** - Register and listen for push notifications
- **Modular** - Include only what's needed. No AngularFire package is above 3kb with most under 2kb (gzipped).

#### Quick links
[Contributing](CONTRIBUTING.md)

[Stackblitz Template](https://stackblitz.com/edit/angular-1iment) - Remember to set your Firebase configuration in `app/app.module.ts`.

[Upgrading to v5.0? Check out our guide.](docs/version-5-upgrade.md)

**Having troubles?** Get help on the [Firebase Mailing List](https://groups.google.com/forum/#!forum/firebase-talk) (offically supported), the [Firebase Community Slack](https://firebase.community/) (look for the `#angularfire2` room), [Gitter](https://gitter.im/angular/angularfire2), or [Stack Overflow](https://stackoverflow.com/questions/tagged/angularfire2).

## Install

```bash
npm install firebase @angular/fire --save
```

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
  constructor(db: AngularFirestore) {
    this.items = db.collection('items').valueChanges();
  }
}
```

## Developer Guide

### Getting started

- [Installation & Setup](docs/install-and-setup.md)

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

### Upload files
- [Getting started with Cloud Storage](docs/storage/storage.md)

### Universal
- [Server-side Rendering with Universal](docs/server-side-rendering.md)

### Send push notifications
- [Getting started with Firebase Messaging](docs/messaging/messaging.md)

### Directly call Cloud Functions
- [Getting started with Callable Functions](docs/functions/functions.md)

### Deploy to Firebase Hosting
- [Deploying AngularFire to Firebase Hosting](docs/deploying-angularfire-to-firebase.md)

### Ionic

- [Installation and Setup with Ionic CLI](docs/ionic/cli.md)
- [Using AngularFire with Ionic 2](docs/ionic/v2.md)
- [Using AngularFire with Ionic 3](docs/ionic/v3.md)
