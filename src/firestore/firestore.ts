import { FirebaseFirestore } from 'firebase/firestore';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Firestore extends FirebaseFirestore {}

export class Firestore {
  constructor(firestore: FirebaseFirestore) {
    return firestore;
  }
}
