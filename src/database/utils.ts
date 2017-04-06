import * as firebase from 'firebase/app';
import { AFUnwrappedDataSnapshot, PathReference, DatabaseReference } from './interfaces';
import { FirebaseApp } from '../app/index';
import { isAbsoluteUrl, isNil, isString } from '../utils';

export function isFirebaseRef(value: any): boolean {
  return typeof value.set === 'function';
}

export function isFirebaseDataSnapshot(value: any): boolean {
  return typeof value.exportVal === 'function';
}

export function isAFUnwrappedSnapshot(value: any): boolean {
  return typeof value.$key === 'string';
}

export function isFirebaseQuery(value: any): boolean {
  return typeof value.orderByChild === 'function';
}

export interface CheckUrlRef {
  isUrl: () => any;
  isRef: () => any;
  isQuery?: () => any;
}

/**
 * Unwraps the data returned in the DataSnapshot. Exposes the DataSnapshot key and exists methods through the $key and $exists properties respectively. If the value is primitive, it is unwrapped using a $value property. The $ properies mean they cannot be saved in the Database as those characters are invalid.
 * @param {DataSnapshot} snapshot - The snapshot to unwrap
 * @return AFUnwrappedDataSnapshot
 * @example
 * unwrapSnapshot(snapshot) => { name: 'David', $key: 'david', $exists: Function }
 */
export function unwrapSnapshot (snapshot:firebase.database.DataSnapshot): AFUnwrappedDataSnapshot {
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

export function checkForUrlOrFirebaseRef(urlOrRef: string | firebase.database.Reference | firebase.database.Query, cases: CheckUrlRef): any {
  if (isString(urlOrRef)) {
    return cases.isUrl();
  }
  if (isFirebaseRef(urlOrRef)) {
    return cases.isRef();
  }
  if (isFirebaseQuery(urlOrRef)) {
    return cases.isQuery();
  }
  throw new Error('Provide a url or a Firebase database reference');
}

/**
 * Returns a database reference given a Firebase App and an
 * absolute or relative path.
 * @param app - Firebase App
 * @param path - Database path, relative or absolute
 */
export function getRef(app: FirebaseApp, pathRef: PathReference): DatabaseReference {
  // if a db ref was passed in, just return it
  if(isFirebaseRef(pathRef)) {
    return pathRef as DatabaseReference;
  }

  const path = pathRef as string;
  if(isAbsoluteUrl(<string>pathRef)) {
    return app.database().refFromURL(path);
  }
  return app.database().ref(path);
}
