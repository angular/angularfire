import { DatabaseReference, DataSnapshot, FirebaseOperation, DatabaseSnapshot } from '../interfaces';
import { checkOperationCases } from '../utils';
import { database } from 'firebase/app';

// TODO(davideast): Find out why TS thinks this returns firebase.Primise
// instead of Promise.
export function createRemoveMethod<T>(ref: DatabaseReference) {
  return function remove(item?: FirebaseOperation): any {
    if(!item) { return ref.remove(); }
    return checkOperationCases(item, {
      stringCase: () => ref.child(<string>item).remove(),
      firebaseCase: () => (<DatabaseReference>item).remove(),
      snapshotCase: () => (<DatabaseSnapshot<T>>item).ref.remove()
    });
  }
}
