/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Injectable,
  Injector,
  NgZone,
  PendingTasks,
  inject
} from '@angular/core';
import { pendingUntilEvent } from '@angular/core/rxjs-interop';
import {
  Observable,
  SchedulerAction,
  SchedulerLike,
  Subscription,
  asyncScheduler,
  queueScheduler
} from 'rxjs';
import { observeOn, subscribeOn } from 'rxjs/operators';

declare const Zone: {current: unknown} | undefined; 

/**
 * Schedules tasks so that they are invoked inside the Zone that is passed in the constructor.
 */
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
      if (targetZone) {
        targetZone.runGuarded(() => {
          work.apply(this, [state]);
        });
      } else {
        work.apply(this, [state]);
      }
    };

    // Scheduling itself needs to be run in zone to ensure setInterval calls for async scheduling are done
    // inside the correct zone. This scheduler needs to schedule asynchronously always to ensure that
    // firebase emissions are never synchronous. Specifying a delay causes issues with the queueScheduler delegate.
    return this.delegate.schedule(workInZone, delay, state);
  }
}

@Injectable({
  providedIn: 'root',
})
export class ɵAngularFireSchedulers {
  public readonly outsideAngular: ɵZoneScheduler;
  public readonly insideAngular: ɵZoneScheduler;

  constructor(public ngZone: NgZone, public pendingTasks: PendingTasks, public injector: Injector) {
    this.outsideAngular = ngZone.runOutsideAngular(
      () => new ɵZoneScheduler(typeof Zone === 'undefined' ? undefined : Zone.current)
    );
    this.insideAngular = ngZone.run(
      () => new ɵZoneScheduler(
        typeof Zone === 'undefined' ? undefined : Zone.current,
        asyncScheduler
      )
    );
  }
}

function getSchedulers() {
  return inject(ɵAngularFireSchedulers);
}

function runOutsideAngular<T>(fn: (...args: any[]) => T): T {
  return getSchedulers().ngZone.runOutsideAngular(() => fn());
}

function run<T>(fn: (...args: any[]) => T): T {
  return getSchedulers().ngZone.run(() => fn());
}

export function observeOutsideAngular<T>(obs$: Observable<T>): Observable<T> {
  return obs$.pipe(observeOn(getSchedulers().outsideAngular));
}

export function observeInsideAngular<T>(obs$: Observable<T>): Observable<T> {
  return obs$.pipe(observeOn(getSchedulers().insideAngular));
}

export function keepUnstableUntilFirst<T>(obs$: Observable<T>): Observable<T> {
   return ɵkeepUnstableUntilFirstFactory(getSchedulers())(obs$);
}

/**
 * Operator to block the zone until the first value has been emitted or the observable
 * has completed/errored. This is used to make sure that universal waits until the first
 * value from firebase but doesn't block the zone forever since the firebase subscription
 * is still alive.
 */
export function ɵkeepUnstableUntilFirstFactory(
  _schedulers: ɵAngularFireSchedulers
) {
  return function keepUnstableUntilFirst<T>(
    obs$: Observable<T>
  ): Observable<T> {
    return obs$.pipe(pendingUntilEvent(getSchedulers().injector));
  }
}

const zoneWrapFn = (
  it: (...args: any[]) => any,
  taskDone: VoidFunction | undefined
) => {
  return (...args: any[]) => {
    if (taskDone) {
      setTimeout(taskDone, 10);
    }
    return run(() => it.apply(this, args));
  };
};

export const ɵzoneWrap = <T= unknown>(it: T, blockUntilFirst: boolean): T => {
  // function() is needed for the arguments object
  return function () {
    let taskDone: VoidFunction | undefined;
    const _arguments = arguments;
    // if this is a callback function, e.g, onSnapshot, we should create a pending task and complete it
    // only once one of the callback functions is tripped.
    for (let i = 0; i < arguments.length; i++) {
      if (typeof _arguments[i] === 'function') {
        if (blockUntilFirst) {
          taskDone ||= run(() => getSchedulers().pendingTasks.add());
        }
        // TODO create a microtask to track callback functions
        _arguments[i] = zoneWrapFn(_arguments[i], taskDone);
      }
    }
    const ret = runOutsideAngular(() => (it as any).apply(this, _arguments));
    if (!blockUntilFirst) {
      if (ret instanceof Observable) {
        const schedulers = getSchedulers();
        return ret.pipe(
          subscribeOn(schedulers.outsideAngular),
          observeOn(schedulers.insideAngular),
        );
      } else {
        return run(() => ret);
      }
    }
    if (ret instanceof Observable) {
      return ret.pipe(keepUnstableUntilFirst) as any;
    } else if (ret instanceof Promise) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return run(
        () =>
          new Promise((resolve, reject) => {
            getSchedulers().pendingTasks.run(() => ret).then(
              (it) => run(() => resolve(it)),
              (reason) => run(() => reject(reason))
            );
          })
      );
    } else if (typeof ret === 'function' && taskDone) {
      // Handle unsubscribe
      // function() is needed for the arguments object
      return function () {
        setTimeout(taskDone, 10);
        return ret.apply(this, arguments);
      };
    } else {
      // TODO how do we handle storage uploads in Zone? and other stuff with cancel() etc?
      return run(() => ret);
    }
  } as any;
};
