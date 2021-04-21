import { DatabaseReference, DatabaseSnapshot, FirebaseOperation } from '../interfaces';
import { checkOperationCases } from '../utils';
import { child } from 'firebase/database';

export function createDataOperationMethod<T>(ref: DatabaseReference, operation: string) {
  return function dataOperation<T>(item: FirebaseOperation, value: T) {
    return checkOperationCases(item, {
      stringCase: () => child(ref, item as string)[operation](value),
      firebaseCase: () => (item as DatabaseReference)[operation](value),
      snapshotCase: () => (item as DatabaseSnapshot<T>).ref[operation](value)
    });
  };
}
