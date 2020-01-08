import { InjectionToken, NgZone } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, Subscription, queueScheduler as queue } from 'rxjs';

// SEMVER put in database.ts when we drop database-depreciated
export const DATABASE_URL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

export class ɵFirebaseZoneScheduler {
  constructor(public zone: NgZone, private platformId: Object) {}
  schedule(...args: any[]): Subscription {
    return <Subscription>this.zone.runGuarded(function() { return queue.schedule.apply(queue, args)});
  }
  // TODO this is a hack, clean it up
  keepUnstableUntilFirst<T>(obs$: Observable<T>) {
    if (isPlatformServer(this.platformId)) {
      return new Observable<T>(subscriber => {
        const noop = () => {};
        // @ts-ignore
        const task = Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop);
        obs$.subscribe(
          next => {
            if (task.state === 'scheduled') { task.invoke() };
            subscriber.next(next);
          },
          error => {
            if (task.state === 'scheduled') { task.invoke() }
            subscriber.error(error);
          },
          () => {
            if (task.state === 'scheduled') { task.invoke() }
            subscriber.complete();
          }
        );
      });
    } else {
      return obs$;
    }
  }
  runOutsideAngular<T>(obs$: Observable<T>): Observable<T> {
    return new Observable<T>(subscriber => {
      return this.zone.runOutsideAngular(() => {
        return obs$.subscribe(
          value => this.zone.run(() => subscriber.next(value)),
          error => this.zone.run(() => subscriber.error(error)),
          ()    => this.zone.run(() => subscriber.complete()),
        );
      });
    });
  }
}

export const ɵrunOutsideAngular = (zone: NgZone) => <T>(obs$: Observable<T>): Observable<T> => {
  return new Observable<T>(subscriber => {
    return zone.runOutsideAngular(() => {
      ɵrunInZone(zone)(obs$).subscribe(subscriber);
    });
  });
}

export const ɵrunInZone = (zone: NgZone) => <T>(obs$: Observable<T>): Observable<T> => {
  return new Observable<T>(subscriber => {
    return obs$.subscribe(
      value => zone.run(() => subscriber.next(value)),
      error => zone.run(() => subscriber.error(error)),
      ()    => zone.run(() => subscriber.complete()),
    );
  });
}

type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type PromiseReturningFunctionPropertyNames<T> = { [K in FunctionPropertyNames<T>]: ReturnType<T[K]> extends Promise<any> ? K : never }[FunctionPropertyNames<T>];
type NonPromiseReturningFunctionPropertyNames<T> = { [K in FunctionPropertyNames<T>]: ReturnType<T[K]> extends Promise<any> ? never : K }[FunctionPropertyNames<T>];
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type PromiseProxy<T> = { [K in NonFunctionPropertyNames<T>]: Promise<T[K]> } &
  { [K in NonPromiseReturningFunctionPropertyNames<T>]: (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>> } &
  { [K in PromiseReturningFunctionPropertyNames<T>   ]: (...args: Parameters<T[K]>) => ReturnType<T[K]> };


// DEBUG quick debugger function for inline logging that typescript doesn't complain about
//       wrote it for debugging the ɵlazySDKProxy, commenting out for now; should consider exposing a
//       verbose mode for AngularFire in a future release that uses something like this in multiple places
//       usage: () => log('something') || returnValue
// const log = (...args: any[]): false => { console.log(...args); return false }

// The problem here are things like ngOnDestroy are missing, then triggering the service
// rather than dig too far; I'm capturing these as I go.
const noopFunctions = ['ngOnDestroy'];

// INVESTIGATE should we make the Proxy revokable and do some cleanup?
//             right now it's fairly simple but I'm sure this will grow in complexity
export const ɵlazySDKProxy = (klass: any, observable: Observable<any>, zone: NgZone) => {
  return new Proxy(klass, {
    get: (_, name:string) => zone.runOutsideAngular(() => {
      if (klass[name]) { return klass[name] }
      if (noopFunctions.includes(name)) { return () => {} }
      let promise = observable.toPromise().then(mod => {
        const ret = mod && mod[name];
        // TODO move to proper type guards
        if (typeof ret == 'function') {
          return ret.bind(mod);
        } else if (ret && ret.then) {
          return ret.then((res:any) => zone.run(() => res));
        } else {
          return zone.run(() => ret);
        }
      });
      // recurse the proxy
      return new Proxy(() => undefined, {
          get: (_, name) => promise[name],
          // TODO handle callbacks as transparently as I can 
          apply: (self, _, args) => promise.then(it => it && it(...args))
        }
      )
    })
  })
};