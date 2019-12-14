import { InjectionToken, NgZone } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, Subscription, queueScheduler as queue } from 'rxjs';

// Put in database.ts when we drop database-depreciated
// SEMVER drop RealtimeDatabaseURL in favor of DATABASE_URL in next major
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');
export const DATABASE_URL = RealtimeDatabaseURL;

export class FirebaseZoneScheduler {
  constructor(public zone: NgZone, private platformId: Object) {}
  schedule(...args: any[]): Subscription {
    return <Subscription>this.zone.runGuarded(function() { return queue.schedule.apply(queue, args)});
  }
  // TODO this is a hack, clean it up
  keepUnstableUntilFirst<T>(obs$: Observable<T>) {
    if (isPlatformServer(this.platformId)) {
      return new Observable<T>(subscriber => {
        const noop = () => {};
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

export const runOutsideAngular = (zone: NgZone) => <T>(obs$: Observable<T>): Observable<T> => {
  return new Observable<T>(subscriber => {
    return zone.runOutsideAngular(() => {
      runInZone(zone)(obs$).subscribe(subscriber);
    });
  });
}

export const runInZone = (zone: NgZone) => <T>(obs$: Observable<T>): Observable<T> => {
  return new Observable<T>(subscriber => {
    return obs$.subscribe(
      value => zone.run(() => subscriber.next(value)),
      error => zone.run(() => subscriber.error(error)),
      ()    => zone.run(() => subscriber.complete()),
    );
  });
}

//SEMVER: once we move to TypeScript 3.6, we can use these to build lazy interfaces
/*
  type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
  type PromiseReturningFunctionPropertyNames<T> = { [K in FunctionPropertyNames<T>]: ReturnType<T[K]> extends Promise<any> ? K : never }[FunctionPropertyNames<T>];
  type NonPromiseReturningFunctionPropertyNames<T> = { [K in FunctionPropertyNames<T>]: ReturnType<T[K]> extends Promise<any> ? never : K }[FunctionPropertyNames<T>];
  type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

  export type PromiseProxy<T> = { [K in NonFunctionPropertyNames<T>]: Promise<T[K]> } &
    { [K in NonPromiseReturningFunctionPropertyNames<T>]: (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>> } &
    { [K in PromiseReturningFunctionPropertyNames<T>   ]: (...args: Parameters<T[K]>) => ReturnType<T[K]> };
*/

export const ɵlazySDKProxy = (klass: any, observable: Observable<any>, zone: NgZone) => new Proxy(klass, {
  get: (_, name) => zone.runOutsideAngular(() =>
    klass[name] || new Proxy(() => 
      observable.toPromise().then(mod => {
        if (mod) {
          const ret = mod[name];
          // TODO move to proper type guards
          if (typeof ret == 'function') {
            return ret.bind(mod);
          } else if (ret && ret.then) {
            return ret.then((res:any) => zone.run(() => res));
          } else {
            return zone.run(() => ret);
          }
        } else {
          // the module is not available, SSR maybe?
          // TODO dig into this deeper, maybe return a never resolving promise?
          return () => {};
        }
      }), {
        get: (self, name) => self()[name],
        // TODO handle callbacks
        apply: (self, _, args) => self().then(it => it(...args))
      })
  )
});