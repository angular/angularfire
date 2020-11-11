import { NgZone } from '@angular/core';
import {
  asyncScheduler,
  Observable,
  Operator,
  queueScheduler,
  SchedulerAction,
  SchedulerLike,
  Subscriber,
  Subscription,
  TeardownLogic
} from 'rxjs';
import { observeOn, subscribeOn, tap } from 'rxjs/operators';

function noop() {
}

/**
 * Schedules tasks so that they are invoked inside the Zone that is passed in the constructor.
 */
// tslint:disable-next-line:class-name
export class ɵZoneScheduler implements SchedulerLike {
  constructor(private zone: any, private delegate: any = queueScheduler) {
  }

  now() {
    return this.delegate.now();
  }

  schedule(work: (this: SchedulerAction<any>, state?: any) => void, delay?: number, state?: any): Subscription {
    const targetZone = this.zone;
    // Wrap the specified work function to make sure that if nested scheduling takes place the
    // work is executed in the correct zone
    const workInZone = function(this: SchedulerAction<any>, state: any) {
      targetZone.runGuarded(() => {
        work.apply(this, [state]);
      });
    };

    // Scheduling itself needs to be run in zone to ensure setInterval calls for async scheduling are done
    // inside the correct zone. This scheduler needs to schedule asynchronously always to ensure that
    // firebase emissions are never synchronous. Specifying a delay causes issues with the queueScheduler delegate.
    return this.delegate.schedule(workInZone, delay, state);
  }
}

// tslint:disable-next-line:class-name
export class ɵBlockUntilFirstOperator<T> implements Operator<T, T> {
  private task: MacroTask | null = null;

  constructor(private zone: any) {
  }

  call(subscriber: Subscriber<T>, source: Observable<T>): TeardownLogic {
    const unscheduleTask = this.unscheduleTask.bind(this);
    this.task = this.zone.run(() => Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop));

    return source.pipe(
      tap({ next: unscheduleTask, complete: unscheduleTask, error: unscheduleTask })
    ).subscribe(subscriber).add(unscheduleTask);
  }

  private unscheduleTask() {
    // maybe this is a race condition, invoke in a timeout
    // hold for 10ms while I try to figure out what is going on
    setTimeout(() => {
      if (this.task != null && this.task.state === 'scheduled') {
        this.task.invoke();
        this.task = null;
      }
    }, 10);
  }
}

// tslint:disable-next-line:class-name
export class ɵAngularFireSchedulers {
  public readonly outsideAngular: ɵZoneScheduler;
  public readonly insideAngular: ɵZoneScheduler;

  constructor(public ngZone: NgZone) {
    this.outsideAngular = ngZone.runOutsideAngular(() => new ɵZoneScheduler(Zone.current));
    this.insideAngular = ngZone.run(() => new ɵZoneScheduler(Zone.current, asyncScheduler));
  }
}

/**
 * Operator to block the zone until the first value has been emitted or the observable
 * has completed/errored. This is used to make sure that universal waits until the first
 * value from firebase but doesn't block the zone forever since the firebase subscription
 * is still alive.
 */
export function ɵkeepUnstableUntilFirstFactory(schedulers: ɵAngularFireSchedulers) {
  return function keepUnstableUntilFirst<T>(obs$: Observable<T>): Observable<T> {
    obs$ = obs$.lift(
      new ɵBlockUntilFirstOperator(schedulers.ngZone)
    );

    return obs$.pipe(
      // Run the subscribe body outside of Angular (e.g. calling Firebase SDK to add a listener to a change event)
      subscribeOn(schedulers.outsideAngular),
      // Run operators inside the angular zone (e.g. side effects via tap())
      observeOn(schedulers.insideAngular)
      // INVESTIGATE https://github.com/angular/angularfire/pull/2315
      // share()
    );
  };
}

// tslint:disable:ban-types
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type PromiseReturningFunctionPropertyNames<T> = {
  [K in FunctionPropertyNames<T>]: ReturnType<T[K]> extends Promise<any> ? K : never
}[FunctionPropertyNames<T>];
type NonPromiseReturningFunctionPropertyNames<T> = {
  [K in FunctionPropertyNames<T>]: ReturnType<T[K]> extends Promise<any> ? never : K
}[FunctionPropertyNames<T>];
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];
// tslint:enable:ban-types

export type ɵPromiseProxy<T> = { [K in NonFunctionPropertyNames<T>]: Promise<T[K]> } &
  { [K in NonPromiseReturningFunctionPropertyNames<T>]: (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>> } &
  { [K in PromiseReturningFunctionPropertyNames<T>]: (...args: Parameters<T[K]>) => ReturnType<T[K]> };


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
    get: (_, name: string) => zone.runOutsideAngular(() => {
      if (klass[name]) {
        return klass[name];
      }
      if (noopFunctions.indexOf(name) > -1) {
        return () => {
        };
      }
      const promise = observable.toPromise().then(mod => {
        const ret = mod && mod[name];
        // TODO move to proper type guards
        if (typeof ret === 'function') {
          return ret.bind(mod);
        } else if (ret && ret.then) {
          return ret.then((res: any) => zone.run(() => res));
        } else {
          return zone.run(() => ret);
        }
      });
      // recurse the proxy
      return new Proxy(() => {}, {
          get: (_, name) => promise[name],
          // TODO handle callbacks as transparently as I can
          apply: (self, _, args) => promise.then(it => it && it(...args))
        }
      );
    })
  });
};

export const ɵapplyMixins = (derivedCtor: any, constructors: any[]) => {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype || baseCtor).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype || baseCtor, name)
      );
    });
  });
};
