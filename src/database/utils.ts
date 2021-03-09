import { DatabaseReference, FirebaseOperation, FirebaseOperationCases, PathReference } from './interfaces';
import { Database } from 'firebase/database';

export function isString(value: any): boolean {
  return typeof value === 'string';
}

export function isFirebaseDataSnapshot(value: any): boolean {
  return typeof value.exportVal === 'function';
}

export function isNil(obj: any): boolean {
  return obj === undefined || obj === null;
}

export function isFirebaseRef(value: any): boolean {
  return typeof value.set === 'function';
}

/**
 * Returns a database reference given a Firebase App and an
 * absolute or relative path.
 * @param database - Firebase Database
 * @param pathRef - Database path, relative or absolute
 */
export function getRef(database: Database, pathRef: PathReference): DatabaseReference {
  // if a db ref was passed in, just return it
  return isFirebaseRef(pathRef) ? pathRef as DatabaseReference
    : database.ref(pathRef as string);
}

export function checkOperationCases(item: FirebaseOperation, cases: FirebaseOperationCases): Promise<void> {
  if (isString(item)) {
    return cases.stringCase();
  } else if (isFirebaseRef(item)) {
    return cases.firebaseCase();
  } else if (isFirebaseDataSnapshot(item)) {
    return cases.snapshotCase();
  }
  throw new Error(`Expects a string, snapshot, or reference. Got: ${typeof item}`);
}
