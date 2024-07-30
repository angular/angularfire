/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  ExperimentalPendingTasks,
  Injectable,
  NgZone
} from '@angular/core';
import {
  Observable,
  Operator,
  SchedulerAction,
  SchedulerLike,
  Subscriber,
  Subscription,
  TeardownLogic,
  asyncScheduler,
  queueScheduler
} from 'rxjs';
import { observeOn, subscribeOn, tap } from 'rxjs/operators';

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

class BlockUntilFirstOperator<T> implements Operator<T, T> {
  constructor(
    private zone: any,
    private pendingTasks: ExperimentalPendingTasks
  ) {}

  call(subscriber: Subscriber<T>, source: Observable<T>): TeardownLogic {
    const taskDone: VoidFunction = this.zone.run(() => this.pendingTasks.add());
    // maybe this is a race condition, invoke in a timeout
    // hold for 10ms while I try to figure out what is going on
    const unscheduleTask = () => setTimeout(taskDone, 10);

    return source.pipe(
      tap({ next: unscheduleTask, complete: unscheduleTask, error: unscheduleTask })
    ).subscribe(subscriber).add(unscheduleTask);
  }
}

@Injectable({
  providedIn: 'root',
})
export class ɵAngularFireSchedulers {
  public readonly outsideAngular: ɵZoneScheduler;
  public readonly insideAngular: ɵZoneScheduler;

  constructor(public ngZone: NgZone, public pendingTasks: ExperimentalPendingTasks) {
    this.outsideAngular = ngZone.runOutsideAngular(
      () => new ɵZoneScheduler(typeof Zone === 'undefined' ? undefined : Zone.current)
    );
    this.insideAngular = ngZone.run(
      () => new ɵZoneScheduler(
        typeof Zone === 'undefined' ? undefined : Zone.current,
        asyncScheduler
      )
    );
    globalThis.ɵAngularFireScheduler ||= this;
  }
}

function getSchedulers() {
  const schedulers = globalThis.ɵAngularFireScheduler as ɵAngularFireSchedulers|undefined;
  if (!schedulers) {
    throw new Error(
`Either AngularFireModule has not been provided in your AppModule (this can be done manually or implictly using
provideFirebaseApp) or you're calling an AngularFire method outside of an NgModule (which is not supported).`);
  }
  return schedulers;
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
  schedulers: ɵAngularFireSchedulers
) {
  return function keepUnstableUntilFirst<T>(
    obs$: Observable<T>
  ): Observable<T> {
    obs$ = obs$.lift(
      new BlockUntilFirstOperator(schedulers.ngZone, schedulers.pendingTasks)
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
            ret.then(
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
