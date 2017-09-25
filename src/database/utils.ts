import * as firebase from 'firebase/app';
import { Subscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs/Scheduler';
import { queue } from 'rxjs/scheduler/queue';
import { AFUnwrappedDataSnapshot, PathReference, DatabaseReference } from './interfaces';
import { FirebaseApp } from 'angularfire2';

const REGEX_ABSOLUTE_URL = /^[a-z]+:\/\/.*/;

export function isNil(obj: any): boolean {
  return obj === undefined || obj === null;
}

export function hasKey(obj: Object, key: string): boolean {
  return obj && obj[key] !== undefined;
}

export function isString(value: any): boolean {
  return typeof value === 'string';
}

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

export function isEmptyObject(obj: Object): boolean {
  if (isNil(obj)) { return false; }
  return Object.keys(obj).length === 0 && JSON.stringify(obj) === JSON.stringify({});
}

export interface CheckUrlRef {
  isUrl: () => any;
  isRef: () => any;
  isQuery?: () => any;
}

/**
 * Unwraps the data returned in the DataSnapshot. Exposes the DataSnapshot key, exists method and getPriority method through the $key, $exists and $priority properties respectively. If the value is primitive, it is unwrapped using a $value property. The $ properies mean they cannot be saved in the Database as those characters are invalid.
 * @param {DataSnapshot} snapshot - The snapshot to unwrap
 * @return AFUnwrappedDataSnapshot
 * @example
 * unwrapMapFn(snapshot) => { name: 'David', $key: 'david', $exists: Function, $priority: Function }
 */
export function unwrapMapFn (snapshot:firebase.database.DataSnapshot): AFUnwrappedDataSnapshot {
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
  Object.defineProperty(unwrapped, '$priority', {
    value: () => {
      return snapshot.getPriority();
    },
    enumerable: false
  });
  return unwrapped;
}

export function stripTrailingSlash(value: string): string {
  // Is the last char a /
  if (value.substring(value.length - 1, value.length) === '/') {
    return value.substring(0, value.length - 1);
  } else {
    return value;
  }
}

function getAbsUrl(root: string, url:string) {
  if (!(/^[a-z]+:\/\/.*/.test(url))) {
    // Provided url is relative.
    // Strip any leading slash
    url = root + '/' + stripLeadingSlash(url);
  }
  return url;
}

export function stripLeadingSlash(value: string): string {
  // Is the last char a /
  if (value.substring(0, 1) === '/') {
    return value.substring(1, value.length);
  } else {
    return value;
  }
}

export function isAbsoluteUrl(url: string) {
  return REGEX_ABSOLUTE_URL.test(url);
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
