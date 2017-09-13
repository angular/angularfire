import * as firebase from 'firebase/app';
import { Subscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs/Scheduler';
import { queue } from 'rxjs/scheduler/queue';
import { PathReference, DatabaseReference } from './interfaces';
import { FirebaseApp } from 'angularfire2';

const REGEX_ABSOLUTE_URL = /^[a-z]+:\/\/.*/;

export function isNil(obj: any): boolean {
  return obj === undefined || obj === null;
}

export function isFirebaseRef(value: any): boolean {
  return typeof value.set === 'function';
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
