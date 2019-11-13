import { InjectionToken, NgZone } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, Subscription, defer, queueScheduler as queue } from 'rxjs';
import { subscribeOn, observeOn, tap } from 'rxjs/operators';

// Put in database.ts when we drop database-depreciated
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

function noop() { }

/**
 * Schedules tasks so that they are invoked inside the Zone that is passed in the constructor.
 */
export class ZoneScheduler {
  constructor(private zone: any) { }

  now() {
    return queue.now();
  }

  schedule(...args: any[]): Subscription {
    return this.zone.runGuarded(function () {
      return queue.schedule.apply(queue, args);
    });
  }
}

function blockUntilFirst(ngZone: NgZone) {
  return function operatorFn<T>(obs$: Observable<T>): Observable<T> {
    // Defer creation of the Zone blocking task until the observable is subscribed to
    return defer(function () {
      // Create a task inside the angular zone to block it
      let task: MicroTask | null = ngZone.run(() => {
        return Zone.current.scheduleMicroTask('firebaseZoneBlock', noop, {}, noop);
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
      // Run the subscription method inside the angular zone
      subscribeOn(schedulers.insideAngular),
      // Run operators inside the angular zone (e.g. side effects via tap())
      observeOn(schedulers.insideAngular)
    );

    if (isPlatformServer(platformId)) {
      return inCorrectZones$.pipe(
        blockUntilFirst(schedulers.ngZone)
      );
    } else {
      return inCorrectZones$;
    }
  }
}
