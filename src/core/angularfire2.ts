import { InjectionToken, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import firebase from '@firebase/app';
import { FirebaseApp, FirebaseOptions } from '@firebase/app-types';

import 'zone.js';
import 'rxjs/add/operator/first';

export const FirebaseAppName = new InjectionToken<string>('angularfire2.appName');
export const FirebaseAppConfig = new InjectionToken<FirebaseOptions>('angularfire2.config');

// Put in database.ts when we drop database-depreciated
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

export class FirebaseZoneScheduler {
  constructor(public zone: NgZone) {}
  // TODO this is a hack, clean it up
  keepUnstableUntilFirst<T>(obs$: Observable<T>) {
    return new Observable<T>(subscriber => {
      const noop = () => {};
      const task = Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop);
      obs$.first().subscribe(() => this.zone.runOutsideAngular(() => task.invoke()));
      return obs$.subscribe(subscriber);
    });
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