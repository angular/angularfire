import { DatabaseReference, FirebaseOperation, DatabaseSnapshot } from '../interfaces';
import { checkOperationCases } from '../utils';
import { createDataOperationMethod } from './data-operation';
import { database, Promise } from 'firebase/app';

// TODO(davideast): Find out why TS thinks this returns firebase.Primise
// instead of Promise.
export function createRemoveMethod(ref: DatabaseReference) {
  return function remove(item?: FirebaseOperation): any {
    if(!item) { return ref.remove() as any; }
    return checkOperationCases(item, {
      stringCase: () => ref.child(<string>item).remove() as any,
      firebaseCase: () => (<DatabaseReference>item).remove() as any,
      snapshotCase: () => (<DatabaseSnapshot>item).ref.remove() as any
    }) as any;
  }
}

