import { DatabaseReference, FirebaseOperation, DatabaseSnapshot } from '../interfaces';
import { checkOperationCases } from '../utils';
import { createDataOperationMethod } from './data-operation';
import { database } from 'firebase/app';

// TODO(davideast): Find out why TS thinks this returns firebase.Primise
// instead of Promise.
export function createRemoveMethod(ref: DatabaseReference) {
  return function remove(item?: FirebaseOperation): any {
    if(!item) { return ref.remove(); }
    return checkOperationCases(item, {
      stringCase: () => ref.child(<string>item).remove(),
      firebaseCase: () => (<DatabaseReference>item).remove(),
      snapshotCase: () => (<DatabaseSnapshot>item).ref.remove()
    });
  }
}
