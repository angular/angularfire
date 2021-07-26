import { FirebaseFirestore } from 'firebase/firestore';
import { ɵgetAllInstancesOf } from '../core';

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
