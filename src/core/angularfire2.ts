import { InjectionToken, NgZone } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Observable, Subscription, queueScheduler as queue } from 'rxjs';
import { first } from 'rxjs/operators';

// Put in database.ts when we drop database-depreciated
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

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
        obs$.pipe(first()).subscribe(() => this.zone.runOutsideAngular(() => task.invoke()));
        return obs$.subscribe(subscriber);
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