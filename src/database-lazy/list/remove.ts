import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DatabaseReference, DatabaseSnapshot, FirebaseOperation } from '../interfaces';
import { checkOperationCases } from '../utils';

// TODO(davideast): Find out why TS thinks this returns firebase.Primise
// instead of Promise.
export function createRemoveMethod<T>(ref$: Observable<DatabaseReference>) {
  return function remove(item?: FirebaseOperation): any {
    if (!item) { return ref$.pipe(switchMap(ref => ref.remove())).toPromise(); }
    return checkOperationCases(item, {
      stringCase: () => ref$.pipe(switchMap(ref => ref.child(item as string).remove())).toPromise(),
      firebaseCase: () => (item as DatabaseReference).remove(),
      snapshotCase: () => (item as DatabaseSnapshot<T>).ref.remove()
    });
  };
}
