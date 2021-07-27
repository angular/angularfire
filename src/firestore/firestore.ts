import { FirebaseFirestore } from 'firebase/firestore';
import { ɵgetAllInstancesOf } from '@angular/fire';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Firestore extends FirebaseFirestore {}

export class Firestore {
  constructor(firestore: FirebaseFirestore) {
    return firestore;
  }
}

export const FIRESTORE_PROVIDER_NAME = 'firestore-exp';

// tslint:disable-next-line:no-empty-interface
export interface FirestoreInstances extends Array<FirebaseFirestore> {}

export class FirestoreInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseFirestore>(FIRESTORE_PROVIDER_NAME);
  }
}

export const firestoreInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseFirestore>(FIRESTORE_PROVIDER_NAME))),
  distinct(),
);
