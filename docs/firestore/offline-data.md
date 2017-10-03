# Offline Data in Firestore

> Cloud Firestore supports offline data persistence. This feature caches a copy of the Cloud Firestore data that your app is actively using, so your app can access the data when the device is offline. You can write, read, listen to, and query the cached data. When the device comes back online, Cloud Firestore synchronizes any local changes made by your app to the data stored remotely in Cloud Firestore.

**Offline persistence is an experimental feature that is supported only by the Chrome, Safari, and Firefox web browsers.** If a user opens multiple browser tabs that point to the same Cloud Firestore database, and offline persistence is enabled, Cloud Firestore will work correctly only in the first tab.

## Enable Offline Data in AngularFirestore

To enable offline persistence in your AngularFire application, call `enablePersistence()` when you are importing `AngularFirestoreModule` into your `@NgModule`:

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule.enablePersistence(),
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}

```

While offline your listeners will receive listen events when the locally cached data changes. You can use to Documents and Collections normally.

To check whether you're receiving data from the server or the cache, use the `fromCache` property on the `SnapshotMetadata` in your snapshot event. If `fromCache` is true, the data came from the cache and might be stale or incomplete. If `fromCache` is false, the data is complete and current with the latest updates on the server.

[To learn more about Offline Persistence in Firestore, check out the Firebase documentation](https://firebase.google.com/docs/firestore/enable-offline).