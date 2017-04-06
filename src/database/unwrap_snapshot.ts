import * as firebase from 'firebase/app';
import { AFUnwrappedDataSnapshot } from './interfaces';
import { isNil } from '../utils';

/**
 * Unwraps the data returned in the DataSnapshot. Exposes the DataSnapshot key and exists methods through the $key and $exists properties respectively. If the value is primitive, it is unwrapped using a $value property. The $ properies mean they cannot be saved in the Database as those characters are invalid.
 * @param {DataSnapshot} snapshot - The snapshot to unwrap
 * @return AFUnwrappedDataSnapshot
 * @example
 * unwrapSnapshot(snapshot) => { name: 'David', $key: 'david', $exists: Function }
 */
export function unwrapSnapshot (snapshot: firebase.database.DataSnapshot): AFUnwrappedDataSnapshot {
  var unwrapped = !isNil(snapshot.val()) ? snapshot.val() : { $value: null };
  if ((/string|number|boolean/).test(typeof unwrapped)) {
    unwrapped = {
      $value: unwrapped
    };
  }
  Object.defineProperty(unwrapped, '$key', {
    value: snapshot.ref.key,
    enumerable: false
  });
  Object.defineProperty(unwrapped, '$exists', {
    value: () => {
      return snapshot.exists();
    },
    enumerable: false
  });
  return unwrapped;
}
