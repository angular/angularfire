import * as firebase from 'firebase/app';
import { Subscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs/Scheduler';
import { queue } from 'rxjs/scheduler/queue';
import { AFUnwrappedDataSnapshot } from './interfaces';

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
 * Unwraps the data returned in the DataSnapshot. Exposes the DataSnapshot key and exists methods through the $key and $exists properties respectively. If the value is primitive, it is unwrapped using a $value property. The $ properies mean they cannot be saved in the Database as those characters are invalid.
 * @param {DataSnapshot} snapshot - The snapshot to unwrap
 * @return AFUnwrappedDataSnapshot
 * @example
 * unwrapMapFn(snapshot) => { name: 'David', $key: 'david', $exists: Function }
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

export function stripTrailingSlash(value: string): string {
  // Is the last char a /
  if (value.substring(value.length - 1, value.length) === '/') {
    return value.substring(0, value.length - 1);
  } else {
    return value;
  }
}

export function stripLeadingSlash(value: string): string {
  // Is the last char a /
  if (value.substring(0, 1) === '/') {
    return value.substring(1, value.length);
  } else {
    return value;
  }
}

/**
 * TODO: remove this scheduler once Rx has a more robust story for working
 * with zones.
 */
export class ZoneScheduler {
  constructor(public zone: Zone) {}

  schedule(...args): Subscription {
    return <Subscription>this.zone.run(() => queue.schedule.apply(queue, args));
  }
}
