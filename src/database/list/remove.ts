import { DatabaseReference, DatabaseSnapshot, FirebaseOperation } from '../interfaces';
import { checkOperationCases } from '../utils';
import { remove, child } from 'firebase/database';

export function createRemoveMethod<T>(ref: DatabaseReference) {
  return function remove(item?: FirebaseOperation): any {
    if (!item) { return remove(ref); }
    return checkOperationCases(item, {
      stringCase: () => remove(child(ref, item as string)),
      firebaseCase: () => remove(item as DatabaseReference),
      snapshotCase: () => remove((item as DatabaseSnapshot<T>).ref)
    });
  };
}
