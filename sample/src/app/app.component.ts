import { ApplicationRef, Component, Optional } from '@angular/core';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { Auth, AuthInstances, authState } from '@angular/fire/auth';
import { Firestore as FirestoreLite, FirestoreInstances as FirestoreLiteInstances } from '@angular/fire/firestore/lite';
import { Firestore, FirestoreInstances, getDoc, doc, DocumentSnapshot } from '@angular/fire/firestore';
import { DocumentData } from 'rxfire/firestore/lite/interfaces';
import { distinctUntilChanged } from 'rxjs/operators';
import { Storage, StorageInstances } from '@angular/fire/storage';
import { Messaging, MessagingInstances, onMessage } from '@angular/fire/messaging';
import { RemoteConfig, RemoteConfigInstances } from '@angular/fire/remote-config';
import { Functions, FunctionsInstances } from '@angular/fire/functions';
import { Database, DatabaseInstances } from '@angular/fire/database';
import { Analytics, AnalyticsInstances } from '@angular/fire/analytics';
import { Performance, PerformanceInstances } from '@angular/fire/performance';
import { getToken } from 'firebase/messaging';
import { SwPush, ServiceWorkerModule } from '@angular/service-worker';

import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  template: `
    <pre>{{ (myDocData | async)?.data() | json }}</pre>
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
  myDocData: Promise<DocumentSnapshot<DocumentData>>;
  title = 'sample';
  constructor(
    app: FirebaseApp, // default Firebase App
    auth: Auth, // default Firbase Auth
    apps: FirebaseApps, // all initialized App instances
    authInstances: AuthInstances, // all initialized Auth instances
    @Optional() firestoreLite: FirestoreLite,
    @Optional() firestoreLiteInstances: FirestoreLiteInstances,
    @Optional() firestore: Firestore,
    @Optional() firestoreInstances: FirestoreInstances,
    storage: Storage,
    storageInstances: StorageInstances,
    @Optional() messaging: Messaging,
    @Optional() messagingInstances: MessagingInstances,
    @Optional() remoteConfig: RemoteConfig,
    @Optional() remoteConfigInstances: RemoteConfigInstances,
    @Optional() functions: Functions,
    @Optional() functionsInstances: FunctionsInstances,
    database: Database,
    databaseInstances: DatabaseInstances,
    @Optional() analytics: Analytics,
    @Optional() analyticsInstances: AnalyticsInstances,
    @Optional() performance: Performance,
    @Optional() performanceInstances: PerformanceInstances,
    appRef: ApplicationRef,
    swPush: SwPush,
    @Optional() serviceWorkerModule: ServiceWorkerModule,
  ) {
    console.log({
      app, auth, apps, authInstances, firestore, firestoreInstances,
      firestoreLite, firestoreLiteInstances, storage, storageInstances,
      messaging, messagingInstances, performance, performanceInstances,
      analytics, analyticsInstances, functions, functionsInstances, database,
      databaseInstances, remoteConfig, remoteConfigInstances
    });
    authState(auth).subscribe(it => console.log('authState', it));
    appRef.isStable.pipe(distinctUntilChanged()).subscribe(it => console.log('isStable', it));
    this.myDocData = getDoc(doc(firestore, 'animals/NJdGQCv1P92SWsp4nSE7'));
    navigator.serviceWorker.register('firebase-messaging-sw.js', { type: 'module' }).then(serviceWorkerRegistration => {
      getToken(messaging, {
        serviceWorkerRegistration,
        vapidKey: environment.vapidKey,
      }).then(it => console.log(it));
    });
    onMessage(messaging, it => console.log('onMessage', it));
  }
}
