import { InjectionToken, NgZone, Inject } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { queue } from 'rxjs/scheduler/queue';
import { isPlatformServer } from '@angular/common';
import { observeOn } from 'rxjs/operator/observeOn';

import { FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';

import {} from 'zone.js';
import 'rxjs/add/operator/first';

export const AppNameToken = new InjectionToken<string|undefined>('angularfire2.app.name');
export const FirebaseOptionsToken = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FirebaseAppConfigToken = new InjectionToken<FirebaseAppConfig|undefined>('angularfire2.app.config');

// Put in database.ts when we drop database-depreciated
export const DatabaseURLToken = new InjectionToken<string>('angularfire2.database.url');

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
        obs$.first().subscribe(() => this.zone.runOutsideAngular(() => task.invoke()));
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