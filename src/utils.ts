import { Subscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs/Scheduler';
import { queue } from 'rxjs/scheduler/queue';

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

export function isEmptyObject(obj: Object): boolean {
  if (isNil(obj)) { return false; }
  return Object.keys(obj).length === 0 && JSON.stringify(obj) === JSON.stringify({});
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
 * TODO: remove this scheduler once Rx has a more robust story for working
 * with zones.
 */
export class ZoneScheduler {
  constructor(public zone: Zone) {}

  schedule(...args): Subscription {
    return <Subscription>this.zone.run(() => queue.schedule.apply(queue, args));
  }
}
