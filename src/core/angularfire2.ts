import { InjectionToken, NgZone } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, Subscription, defer, asyncScheduler, SchedulerLike, SchedulerAction } from 'rxjs';
import { subscribeOn, observeOn, tap } from 'rxjs/operators';

// Put in database.ts when we drop database-depreciated
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

function noop() { }

/**
 * Schedules tasks so that they are invoked inside the Zone that is passed in the constructor.
 */
export class ZoneScheduler implements SchedulerLike {
  constructor(private zone: any, private delegate: any = asyncScheduler) { }

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
    // inside the correct zone
    return this.zone.runGuarded(() => this.delegate.schedule(workInZone, delay, state));
  }
}

function blockUntilFirst(ngZone: NgZone) {
  return function operatorFn<T>(obs$: Observable<T>): Observable<T> {
    // Defer creation of the Zone blocking task until the observable is subscribed to
    return defer(function () {
      // Create a task inside the angular zone to block it
      let task: MacroTask | null = ngZone.run(() => {
        return Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop);
      });

      // Cancel the task in the zone to unblock it. This is cheaper than invoke since there is
      // no context switch needed
      function cancelTask() {
        if (task != null && task.state === 'scheduled') {
          task.zone.cancelTask(task);
          task = null;
        }
      }

      return obs$.pipe(
        tap(cancelTask, cancelTask, cancelTask)
      );
    });
  }
}

export class AngularFireSchedulers {
  public readonly outsideAngular: ZoneScheduler;
  public readonly insideAngular: ZoneScheduler;

  constructor(public ngZone: NgZone) {
    this.outsideAngular = ngZone.runOutsideAngular(() => new ZoneScheduler(Zone.current));
    this.insideAngular = ngZone.run(() => new ZoneScheduler(Zone.current));
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
    const inCorrectZones$ = obs$.pipe(
      // Run the subscribe body outside of Angular (e.g. calling Firebase SDK to add a listener to a change event)
      subscribeOn(schedulers.outsideAngular),
      // Run operators inside the angular zone (e.g. side effects via tap())
      observeOn(schedulers.insideAngular),
      share()
      );
    } else {
      return inCorrectZones$;
    }
  }
}
