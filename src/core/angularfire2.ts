import { InjectionToken, NgZone } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, Subscription, SchedulerLike, SchedulerAction, queueScheduler, Operator, Subscriber, TeardownLogic, asyncScheduler } from 'rxjs';
import { subscribeOn, observeOn, tap, share } from 'rxjs/operators';

// Put in database.ts when we drop database-depreciated
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

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
