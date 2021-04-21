import { DatabaseReference, DatabaseSnapshot, FirebaseOperation } from '../interfaces';
import { checkOperationCases } from '../utils';

// TODO(davideast): Find out why TS thinks this returns firebase.Primise
// instead of Promise.
export function createRemoveMethod<T>(ref: DatabaseReference) {
  return function remove(item?: FirebaseOperation): any {
    if (!item) { return ref.remove(); }
    return checkOperationCases(item, {
      stringCase: () => ref.child(item as string).remove(),
      firebaseCase: () => (item as DatabaseReference).remove(),
      snapshotCase: () => (item as DatabaseSnapshot<T>).ref.remove()
    });
  };
}
