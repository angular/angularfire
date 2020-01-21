import { InjectionToken, NgZone } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, Subscription, SchedulerLike, SchedulerAction, queueScheduler, Operator, Subscriber, TeardownLogic, asyncScheduler } from 'rxjs';
import { subscribeOn, observeOn, tap, share } from 'rxjs/operators';

// Put in database.ts when we drop database-depreciated
// SEMVER drop RealtimeDatabaseURL in favor of DATABASE_URL in next major
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');
export const DATABASE_URL = RealtimeDatabaseURL;

function noop() { }

/**
 * Schedules tasks so that they are invoked inside the Zone that is passed in the constructor.
 */
export class ZoneScheduler implements SchedulerLike {
  constructor(private zone: any, private delegate: any = queueScheduler) { }

  now() {
    return this.delegate.now();
  }

  schedule(work: (this: SchedulerAction<any>, state?: any) => void, delay?: number, state?: any): Subscription {
    const targetZone = this.zone;
    // Wrap the specified work function to make sure that if nested scheduling takes place the
    // work is executed in the correct zone
    const workInZone = function (this: SchedulerAction<any>, state: any) {
      targetZone.runGuarded(() => {
        work.apply(this, [state]);
      });
    }

    // Scheduling itself needs to be run in zone to ensure setInterval calls for async scheduling are done
    // inside the correct zone. This scheduler needs to schedule asynchronously always to ensure that
    // firebase emissions are never synchronous. Specifying a delay causes issues with the queueScheduler delegate.
    return this.delegate.schedule(workInZone, delay, state)
  }
}

export class BlockUntilFirstOperator<T> implements Operator<T, T> {
  private task: MacroTask | null = null;

  constructor(private zone: any) { }

  call(subscriber: Subscriber<T>, source: Observable<T>): TeardownLogic {
    const unscheduleTask = this.unscheduleTask.bind(this);
    this.task = this.zone.run(() => Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop));

    return source.pipe(
      tap(unscheduleTask, unscheduleTask, unscheduleTask)
    ).subscribe(subscriber).add(unscheduleTask);
  }

  private unscheduleTask() {
    if (this.task != null && this.task.state === 'scheduled') {
      this.task.invoke();
      this.task = null;
    }
  }
}

export class AngularFireSchedulers {
  public readonly outsideAngular: ZoneScheduler;
  public readonly insideAngular: ZoneScheduler;

  constructor(public ngZone: NgZone) {
    this.outsideAngular = ngZone.runOutsideAngular(() => new ZoneScheduler(Zone.current));
    this.insideAngular = ngZone.run(() => new ZoneScheduler(Zone.current, asyncScheduler));
  }
}

/**
 * Operator to block the zone until the first value has been emitted or the observable
 * has completed/errored. This is used to make sure that universal waits until the first
 * value from firebase but doesn't block the zone forever since the firebase subscription
 * is still alive.
 */
export function keepUnstableUntilFirstFactory(
  schedulers: AngularFireSchedulers,
  platformId: Object
) {
  return function keepUnstableUntilFirst<T>(obs$: Observable<T>): Observable<T> {
    if (isPlatformServer(platformId)) {
      obs$ = obs$.lift(
        new BlockUntilFirstOperator(schedulers.ngZone)
      );
    }

    return obs$.pipe(
      // Run the subscribe body outside of Angular (e.g. calling Firebase SDK to add a listener to a change event)
      subscribeOn(schedulers.outsideAngular),
      // Run operators inside the angular zone (e.g. side effects via tap())
      observeOn(schedulers.insideAngular),
      share()
    );
  }
}

// SEMVER: drop v6, here for compatibility
export const runOutsideAngular = (zone: NgZone) => <T>(obs$: Observable<T>): Observable<T> => {
  return new Observable<T>(subscriber => {
    return zone.runOutsideAngular(() => {
      runInZone(zone)(obs$).subscribe(subscriber);
    });
  });
}

// SEMVER: drop v6, here for compatibility
export const runInZone = (zone: NgZone) => <T>(obs$: Observable<T>): Observable<T> => {
  return new Observable<T>(subscriber => {
    return obs$.subscribe(
      value => zone.run(() => subscriber.next(value)),
      error => zone.run(() => subscriber.error(error)),
      ()    => zone.run(() => subscriber.complete()),
    );
  });
}

// SEMVER: drop v6, here for compatibility
export class FirebaseZoneScheduler {
  constructor(public zone: NgZone, private platformId: Object) {}
  schedule(...args: any[]): Subscription {
    return <Subscription>this.zone.runGuarded(function() { return queueScheduler.schedule.apply(queueScheduler, args)});
  }
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