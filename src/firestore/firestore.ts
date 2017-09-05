import * as firebase from 'firebase/app';
import 'firestore';
import { Firestore, CollectionReference, Query, DocumentSnapshot, QuerySnapshot } from 'firestore';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { Injectable } from '@angular/core';
import { FirebaseApp } from 'angularfire2';

@Injectable()
export class AngularFirestore {
  firestore: Firestore;

  constructor(public app: FirebaseApp) {
    this.firestore = app.firestore();
  }
  
  collection(path: string, queryFn: (ref: CollectionReference) => Query = ref => ref): Observable<QuerySnapshot> {
    const ref = this.firestore.collection(path);
    const query = queryFn(ref);    
    return new Observable(subscriber => {
      const unsubscribe = query.onSnapshot(subscriber);
      return new Subscription(unsubscribe);
    });
  }

  doc(path: string): Observable<DocumentSnapshot> {
    const ref = this.firestore.doc(path);
    return new Observable(subscriber => {
      const unsubscribe = ref.onSnapshot(subscriber);
      return new Subscription(unsubscribe);
    });
  }
}
