import { Injectable, NgZone } from '@angular/core';
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

class BlockUntilFirstOperator<T> implements Operator<T, T> {
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

@Injectable({
  providedIn: 'root',
})
// tslint:disable-next-line:class-name
export class ɵAngularFireSchedulers {
  public readonly outsideAngular: ɵZoneScheduler;
  public readonly insideAngular: ɵZoneScheduler;

  constructor(public ngZone: NgZone) {
    this.outsideAngular = ngZone.runOutsideAngular(() => new ɵZoneScheduler(Zone.current));
    this.insideAngular = ngZone.run(() => new ɵZoneScheduler(Zone.current, asyncScheduler));
    globalThis.ɵAngularFireScheduler ||= this;
  }
}

function getSchedulers() {
  const schedulers = globalThis.ɵAngularFireScheduler as ɵAngularFireSchedulers|undefined;
  if (!schedulers) { throw new Error('AngularFireModule has not been provided'); }
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
  const scheduler = getSchedulers();
  obs$ = obs$.lift(
    new BlockUntilFirstOperator(scheduler.ngZone)
  );
  return obs$.pipe(
    // Run the subscribe body outside of Angular (e.g. calling Firebase SDK to add a listener to a change event)
    subscribeOn(scheduler.outsideAngular),
    // Run operators inside the angular zone (e.g. side effects via tap())
    observeOn(scheduler.insideAngular)
  );
}

const zoneWrapFn = (it: (...args: any[]) => any) => {
  const _this = this;
  // function() is needed for the arguments object
  // tslint:disable-next-line:only-arrow-functions
  return function() {
    return run(() => it.apply(_this, arguments));
  };
};

export const ɵzoneWrap = <T= Observable<any>|number>(it: (..._: any[]) => T, args: IArguments): T => {
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] === 'function') {
      args[i] = zoneWrapFn(args[i]);
    }
  }
  const ret = runOutsideAngular(() => it.apply(this, args));
  if (ret instanceof Observable) {
    return ret.pipe(keepUnstableUntilFirst) as any;
  } else {
    return run(() => ret);
  }
};
