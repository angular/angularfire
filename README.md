<p align="center">
  <h1 align="center">AngularFire</h1>
  <p align="center">The official library for Firebase and Angular</p>
</p>

[![Build Status](https://travis-ci.org/angular/angularfire2.svg?branch=master)](https://travis-ci.org/angular/angularfire2) [![Join the chat at https://gitter.im/angular/angularfire2](https://badges.gitter.im/angular/angularfire2.svg)](https://gitter.im/angular/angularfire2?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Status: Release candidate

## What is AngularFire?

- **Observable based** - Use the power of RxJS, Angular, and Firebase.
- **Real-time bindings** - Synchronize data in real-time.
- **Authentication** - Log users in with a variety of providers and monitor authentication state in realtime.
- **Offline Data** - Store data offline automatically with AngularFirestore.
- **ngrx friendly** - Integrate with ngrx using AngularFire's action based APIs.

#### Quick links
[Contributing](CONTRIBUTING.md)

[Stackblitz Template](https://stackblitz.com/edit/angular-1iment) - Remember to set your Firebase configuration in `app/app.module.ts`.

[Upgrading to v5.0? Check out our guide.](docs/version-5-upgrade.md)

**Having troubles?** Get help on the [Firebase Mailing List](https://groups.google.com/forum/#!forum/firebase-talk) (officially supported), the [Firebase Community Slack](https://firebase.community/) (look for the `#angularfire2` room), [Gitter](https://gitter.im/angular/angularfire2), or [Stack Overflow](https://stackoverflow.com/questions/tagged/angularfire2).

## Install

```bash
npm install firebase angularfire2 --save
```

## Example use:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
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

> `AngularFireDatabase` allows you to work with the Realtime Database, Firebase's original database. It's an efficient, low-latency solution for mobile apps that require synced states across clients in real-time.

- [Objects](docs/rtdb/objects.md)
- [Lists](docs/rtdb/lists.md)
- [Querying lists](docs/rtdb/querying-lists.md)

### Authenticate users

- [Getting started with Firebase Authentication](docs/auth/getting-started.md)

### Upload files
- [Getting started with Cloud Storage](docs/storage/storage.md)

### Deploying your application

#### Static hosting on Firebase

> Firebase Hosting is production-grade web content hosting for developers. With Hosting, you can quickly and easily deploy web apps and static content to a global content delivery network (CDN) with a single command.

- [Deploy your Angular application with Firebase Hosting](docs/deploying-angularfire-to-firebase.md)

#### Angular Universal

> Angular Universal is a technology that allows you to run your Angular application on a server; this allows you to generate your HTML with a process called server-side rendering (SSR). Angularfire is compatible with server-side rendering; allowing you to take advantage of the performance gains and SEO granted by the technology.

- [Getting started with Angularfire and Universal](docs/universal/getting-started.md)

You have two options for deploying your Universal application, on-demand or pre-rendered (or a combination thereof):

##### Render your application on-demand in response to HTTP requests

> Server-side rendered pages can be generated on the server in response to a request from a web browser.

- [Deploying your Universal application on Cloud Functions for Firebase](docs/universal/cloud-functions.md)
- [Proxy Firebase Hosting to Cloud Functions for Firebase](docs/universal/hosting-proxy.md)

#### Pre-rendering your application to serve statically

> Server-side rendered pages can also be pre-generated and rendered statically on hosting. This allows you to avoid the costs and complexity of spinning up servers in response to requests, while maintaining most of the benefits. It is often preferable if you don't have a lot of dynamic content or it changes infrequently.

- [Prerendering your Universal application and deploying on Firebase Hosting](docs/universal/prerendering.md)

### Ionic

- [Installation and Setup with Ionic CLI](docs/ionic/cli.md)
- [Using AngularFire with Ionic 2](docs/ionic/v2.md)
- [Using AngularFire with Ionic 3](docs/ionic/v3.md)
