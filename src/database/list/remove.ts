import { DatabaseReference, FirebaseOperation, DatabaseSnapshot } from '../interfaces';
import { checkOperationCases } from '../utils';
import { createDataOperationMethod } from './data-operation';
import { database, Promise } from 'firebase/app';

export function createRemoveMethod(ref: DatabaseReference) {
  return function remove(item?: FirebaseOperation) {
    if(!item) { return ref.remove(); }
    return createDataOperationMethod(ref, 'remove')(item, null)
  }
}

