
import { DatabaseReference, FirebaseOperation, DatabaseSnapshot } from '../interfaces';
import { checkOperationCases } from '../utils';

export function createDataOperationMethod<T>(ref: DatabaseReference, operation: string) {
  return function dataOperation<T>(item: FirebaseOperation, value: T) {
    return checkOperationCases(item, {
      stringCase: () => ref.child(<string>item)[operation](value),
      firebaseCase: () => (<DatabaseReference>item)[operation](value),
      snapshotCase: () => (<DatabaseSnapshot>item).ref[operation](value)
    });
  }
}
