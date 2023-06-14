# AngularFire
The official [Angular](https://angular.io/) library for [Firebase](https://firebase.google.com/).

<strong><pre>ng add @angular/fire</pre></strong>

AngularFire smooths over the rough edges an Angular developer might encounter when implementing the framework-agnostic [Firebase JS SDK](https://github.com/firebase/firebase-js-sdk) & aims to provide a more natural developer experience by conforming to Angular conventions.

- **Dependency injection** - Provide and Inject Firebase services in your components
- **Zone.js wrappers** - Stable zones allow proper functionality of service workers, forms, SSR, and pre-rendering
- **Observable based** - Utilize RxJS rather than callbacks for realtime streams
- **NgRx friendly API** - Integrate with NgRx using AngularFire's action based APIs.
- **Lazy-loading** - AngularFire dynamically imports much of Firebase, reducing time to load your app
- **Deploy schematics** - Get your Angular application deployed on Firebase Hosting with a single command
- **Google Analytics** - Zero-effort Angular Router awareness in Google Analytics
- **Router Guards** - Guard your Angular routes with built-in Firebase Authentication checks

## Example use

```ts
import { provideFirebaseApp, getApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

@NgModule({
  imports: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideFirestore(() => getFirestore()),
  ],
  ...
})
export class AppModule { }
```

```ts
import { inject } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface Item {
  name: string,
  ...
};

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
export class AppComponent {
  item$: Observable<Item[]>;
  firestore: Firestore = inject(Firestore);

  constructor() {
    const itemCollection = collection(this.firestore, 'items');
    this.item$ = collectionData(collection);
  }
}
```

## Compatibility

### Angular and Firebase versions

AngularFire doesn't follow Angular's versioning as Firebase also has breaking changes throughout the year. Instead we try to maintain compatibility with both Firebase and Angular majors for as long as possible, only breaking when we need to support a new major of one or the other.

| Angular | Firebase | AngularFire  |
| --------|----------|--------------|
| 16      | 9        | ^7.6         |
| 15      | 9        | ^7.5         |
| 14      | 9        | ^7.4         |
| 13      | 9        | ^7.2         |
| 12      | 9        | ^7.0         |
| 12      | 7,8      | ^6.1.5       |
| 11      | 7,8      | ^6.1         |
| 10      | 8        | ^6.0.4       |
| 10      | 7        | ^6.0.3       |
| 9       | 8        | ^6.0.4       |
| 9       | 7        | ^6.0         |

<sub>Version combinations not documented here __may__ work but are untested and you will see NPM peer warnings.</sub>

### Polyfills

Neither AngularFire or Firebase ship with polyfills. To have compatability across as wide-range of environments we suggest the following polyfills be added to your application:

| API | Environments | Suggested Polyfill | License |
|-----|--------------|--------------------|---------|
| Various ES5+ features  | Safari &lt; 10 | [`core-js/stable`](https://github.com/zloirock/core-js#readme) | MIT |
| `globalThis` | [Chrome &lt; 71<br>Safari &lt; 12.1<br>iOS &lt; 12.2<br>Node &lt; 12](https://caniuse.com/mdn-javascript_builtins_globalthis) | [`globalThis`](https://github.com/es-shims/globalThis#readme) | MIT |
| `Proxy` | [Safari &lt; 10](https://caniuse.com/proxy) | [`proxy-polyfill`](https://github.com/GoogleChrome/proxy-polyfill#readme) | Apache 2.0 |
| `fetch` | [Safari &lt; 10.1<br>iOS &lt; 10.3](https://caniuse.com/fetch) | [`cross-fetch`](https://github.com/lquixada/cross-fetch#readme) | MIT |

## Resources

[Quickstart](docs/install-and-setup.md) - Get your first application up and running by following our quickstart guide.

[Contributing](CONTRIBUTING.md)

[Stackblitz Template](https://stackblitz.com/edit/angular-fire-start) - Remember to set your Firebase configuration in `app/app.module.ts`.

[Upgrading to v7.0? Check out our guide.](docs/version-7-upgrade.md)

### Sample apps

We have three sample apps in this repository:

1. [`samples/compat`](samples/compat) a kitchen sink application that demonstrates use of the "compatability" API
1. [`samples/modular`](samples/modular) a kitchen sink application that demonstrates the new tree-shakable API
1. [`samples/advanced`](samples/advanced) the same app as `samples/modular` but demonstrates more advanced concepts such as Angular Universal state-transfer, dynamically importing Firebase feature modules, and Firestore data bundling.

### Having troubles?

Get help on our [Q&A board](https://github.com/angular/angularfire/discussions?discussions_q=category%3AQ%26A), the official [Firebase Mailing List](https://groups.google.com/forum/#!forum/firebase-talk), the [Firebase Community Slack](https://firebase.community/) (`#angularfire2`), the [Angular Community Discord](http://discord.gg/angular) (`#firebase`), [Gitter](https://gitter.im/angular/angularfire2), the [Firebase subreddit](https://www.reddit.com/r/firebase), or [Stack Overflow](https://stackoverflow.com/questions/tagged/angularfire2).

> **NOTE:** AngularFire is maintained by Googlers but is not a supported Firebase product. Questions on the mailing list and issues filed here are answered on a <strong>best-effort basis</strong> by maintainers and other community members. If you are able to reproduce a problem with Firebase <em>outside of AngularFire's implementation</em>, please [file an issue on the Firebase JS SDK](https://github.com/firebase/firebase-js-sdk/issues) or reach out to the personalized [Firebase support channel](https://firebase.google.com/support/).

## Developer Guide

This developer guide assimes you're using the new tree-shakable AngularFire API, [if you're looking for the compatability API you can find the documentation here](docs/compat.md).

[See the v7 upgrade guide for more information on this change.](docs/version-7-upgrade.md).

### Firebase product integrations

<table>
  <tr>
    <td>

#### [Analytics](docs/analytics.md#analytics)
```ts
import { } from '@angular/fire/analytics';
```
</td>
    <td>

#### [Authentication](docs/auth.md#authentication)
```ts
import { } from '@angular/fire/auth';
```
</td>
  </tr>
  <tr>
    <td>

#### [Cloud Firestore](docs/firestore.md#cloud-firestore)
```ts
import { } from '@angular/fire/firestore';
```
</td>
    <td>

#### [Cloud Functions](docs/functions.md#cloud-functions)
```ts
import { } from '@angular/fire/functions';
```
</td>
  </tr>
  <tr>
    <td>

#### [Cloud Messaging](docs/messaging.md#cloud-messaging)
```ts
import { } from '@angular/fire/messaging';
```
</td>
    <td>

#### [Cloud Storage](docs/storage.md#cloud-storage)
```ts
import { } from '@angular/fire/storage';
```
</td>
  </tr>
  <tr>
    <td>

#### [Performance Monitoring](docs/performance.md#performance-monitoring)
```ts
import { } from '@angular/fire/performance';
```
</td>
    <td>

#### [Realtime Database](docs/database.md#realtime-database)
```ts
import { } from '@angular/fire/database';
```
</td>
  </tr>
  <tr>
    <td>

#### [Remote Config](docs/remote-config.md#remote-config)
```ts
import { } from '@angular/fire/remote-config';
```
</td>
    <td>

#### [App Check](docs/app-check.md#app-check)
```ts
import { } from '@angular/fire/app-check';
```
</td>
  </tr>
</table>

### Deploying your site

* Deploy to Firebase Hosting
* Angular Universal: Deploy to Cloud Functions
* Angular Universal: Deploy to Cloud Run
