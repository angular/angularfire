import { ApplicationRef, Component, NgZone } from '@angular/core';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { Auth, AuthInstances, authState } from '@angular/fire/auth';
import { Firestore, FirestoreInstances, getDoc, doc, DocumentSnapshot } from '@angular/fire/firestore/lite';
import { DocumentData } from 'rxfire/firestore/lite/interfaces';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
    public app: FirebaseApp, // default Firebase App
    public auth: Auth, // default Firbase Auth
    public apps: FirebaseApps, // all initialized App instances
    public authInstances: AuthInstances, // all initialized Auth instances
    public firestore: Firestore,
    public firestoreInstances: FirestoreInstances,
    appRef: ApplicationRef,
    zone: NgZone,
  ) {
    console.log({app, auth, apps, authInstances, firestore, firestoreInstances });
    authState(auth).subscribe(it => console.log('authState', it));
    appRef.isStable.pipe(distinctUntilChanged()).subscribe(it => console.log('isStable', it));
    this.myDocData = getDoc(doc(firestore, 'animals/NJdGQCv1P92SWsp4nSE7'));
    // firestoreInstance$.subscribe(it => console.log('$', it));
    // initializeFirestore$.subscribe(it => console.log('init', it));
  }
}
