import { ApplicationRef, Component, Optional } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, getDoc, doc, DocumentSnapshot } from '@angular/fire/firestore';
import { DocumentData } from 'rxfire/firestore/lite/interfaces';
import { distinctUntilChanged } from 'rxjs/operators';
import { Messaging, onMessage } from '@angular/fire/messaging';
import { getToken } from '@angular/fire/messaging';
import { Storage } from '@angular/fire/storage';
import { Functions } from '@angular/fire/functions';

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
    appRef: ApplicationRef,
    auth: Auth,
    firestore: Firestore,
    @Optional() messaging: Messaging,
  ) {
    authState(auth).subscribe(it => console.log('authState', it));
    appRef.isStable.pipe(distinctUntilChanged()).subscribe(it => console.log('isStable', it));
    this.myDocData = getDoc(doc(firestore, 'animals/NJdGQCv1P92SWsp4nSE7'));
    if (messaging) {
      navigator.serviceWorker.register('firebase-messaging-sw.js', { type: 'module' }).then(serviceWorkerRegistration => {
        getToken(messaging, {
          serviceWorkerRegistration,
          vapidKey: environment.vapidKey,
        }).then(it => console.log(it));
      });
      onMessage(messaging, it => console.log('onMessage', it));
    }
  }
}
