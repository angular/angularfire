import { ApplicationRef, Component, NgZone } from '@angular/core';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { Auth, AuthInstances, authState } from '@angular/fire/auth';
import { Firestore as FirestoreLite, FirestoreInstances as FirestoreLiteInstances, getDoc, doc, DocumentSnapshot } from '@angular/fire/firestore/lite';
import { Firestore, FirestoreInstances } from '@angular/fire/firestore';
import { DocumentData } from 'rxfire/firestore/lite/interfaces';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Storage, StorageInstances } from '@angular/fire/storage';
import { Messaging, MessagingInstances } from '@angular/fire/messaging';
import { RemoteConfig, RemoteConfigInstances } from '@angular/fire/remote-config';
import { Functions, FunctionsInstances } from '@angular/fire/functions';
import { Database, DatabaseInstances } from '@angular/fire/database';
import { Analytics, AnalyticsInstances } from '@angular/fire/analytics';
import { Performance, PerformanceInstances } from '@angular/fire/performance';

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
    firestoreLite: FirestoreLite,
    firestoreLiteInstances: FirestoreLiteInstances,
    firestore: Firestore,
    firestoreInstances: FirestoreInstances,
    storage: Storage,
    storageInstances: StorageInstances,
    messaging: Messaging,
    messagingInstances: MessagingInstances,
    remoteConfig: RemoteConfig,
    remoteConfigInstances: RemoteConfigInstances,
    functions: Functions,
    functionsInstances: FunctionsInstances,
    database: Database,
    databaseInstances: DatabaseInstances,
    analytics: Analytics,
    analyticsInstances: AnalyticsInstances,
    performance: Performance,
    performanceInstances: PerformanceInstances,
    appRef: ApplicationRef,
    zone: NgZone,
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
    this.myDocData = getDoc(doc(firestoreLite, 'animals/NJdGQCv1P92SWsp4nSE7'));
    console.log((app as any).container);
    // firestoreInstance$.subscribe(it => console.log('$', it));
    // initializeFirestore$.subscribe(it => console.log('init', it));
  }
}
