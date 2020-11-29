import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DatabaseReference, DatabaseSnapshot, FirebaseOperation } from '../interfaces';
import { checkOperationCases } from '../utils';

export function createDataOperationMethod<T>(ref$: Observable<DatabaseReference>, operation: string) {
  return function dataOperation<T>(item: FirebaseOperation, value: T) {
    return checkOperationCases(item, {
      // TODO fix the typing here, rather than lean on any
      stringCase: () => ref$.pipe(switchMap(ref => ref.child(item as string)[operation](value))).toPromise() as any,
      firebaseCase: () => (item as DatabaseReference)[operation](value),
      snapshotCase: () => (item as DatabaseSnapshot<T>).ref[operation](value)
    });
  };
}
