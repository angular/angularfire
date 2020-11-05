# AngularFire
The official [Angular](https://angular.io/) library for [Firebase](https://firebase.google.com/).

<strong><pre>ng add @angular/fire</pre></strong>

AngularFire smooths over the rough edges a developer might encounter when implementing the framework-agnostic [Firebase JS SDK](https://github.com/firebase/firebase-js-sdk) in an Angular application and aims to provide a more natural developer expirience by conforming to Angular conventions.

- **Dependency injection** - Provide and Inject Firebase services in your components
- **Zone.js wrappers** - Stable zones mean proper functionality of service workers, forms, SSR, and pre-rendering
- **Observable based** - Utilize RxJS rather than callbacks for realtime streams
- **NgRx friendly API** - Integrate with NgRx using AngularFire's action based APIs.
- **Lazy-loading** - AngularFire dynamically imports much of Firebase, reducing time it takes to first load your application
- **Deploy schematics** - Get your Angular application deployed on Firebase Hosting & Cloud Functions with a single command
- **Google Analytics** - Zero-effort Angular Router awareness in Google Analytics with our `ScreenTrackingService`
- **Router Guards** - Guard your Angular routes with built-in Firebase Authentication checks

## Example use

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
  <ul>
    <li *ngFor="let item of item$ | async">
      {{ item.name }}
    </li>
  </ul>
  `
})
export class MyApp {
  item$: Observable<any[]>;
  constructor(firestore: AngularFirestore) {
    this.item$ = firestore.collection('items').valueChanges();
  }
}
```

## Compatibility

| Angular | Firebase | AngularFire  |
| --------|----------|--------------|
| 10      | 8        | ^6.0.4       |
| 10      | 7        | ^6.0.3       |
| 9       | 8        | ^6.0.4       |
| 9       | 7        | ^6.0         |
| 8       | 7        | ^5.2.3       |
| 8       | 6        | ^5.2.0       |

<sub>Version combinations not documented here __may__ work but are untested and you will see NPM peer warnings.</sub>

## Resources

[Quickstart](docs/install-and-setup.md) - Get your first application up and running by following our quickstart guide.

[Contributing](CONTRIBUTING.md)

[Stackblitz Template](https://stackblitz.com/edit/angular-fire-start) - Remember to set your Firebase configuration in `app/app.module.ts`.

[Upgrading to v6.0? Check out our guide.](docs/version-6-upgrade.md)

**Having troubles?** Get help on the official [Firebase Mailing List](https://groups.google.com/forum/#!forum/firebase-talk), the [Firebase Community Slack](https://firebase.community/) (`#angularfire2`), the [Angular Community Discord](http://discord.gg/angular) (`#firebase`), [Gitter](https://gitter.im/angular/angularfire2), or [Stack Overflow](https://stackoverflow.com/questions/tagged/angularfire2).

AngularFire is maintained by Googlers but is not a supported Firebase product. Questions on the mailing list and issues filed here are answered on a <strong>best-effort basis</strong> by maintainers and other community members.

If you can reproduce a problem with Firebase outside of AngularFire's implementation, please [file an issue on the Firebase JS SDK's GitHub repo](https://github.com/firebase/firebase-js-sdk/issues) or reach out to the personalized [Firebase support channel](https://firebase.google.com/support/).

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
