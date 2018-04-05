import { InjectionToken, NgZone } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { queue } from 'rxjs/scheduler/queue';

import firebase from '@firebase/app';
import { FirebaseApp, FirebaseOptions } from '@firebase/app-types';

import 'zone.js';
import 'rxjs/add/operator/first';
import { Subscriber } from 'rxjs/Subscriber';
import { observeOn } from 'rxjs/operator/observeOn';

export const FirebaseAppName = new InjectionToken<string>('angularfire2.appName');
export const FirebaseAppConfig = new InjectionToken<FirebaseOptions>('angularfire2.config');

// Put in database.ts when we drop database-depreciated
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

export const UniversalDatabaseTransferStateKeyPrefix = new InjectionToken<string>('angularfire2.dbTransferStateKey');

export class FirebaseZoneScheduler {
  constructor(public zone: NgZone) {}
  schedule(...args: any[]): Subscription {
    return <Subscription>this.zone.runGuarded(function() { return queue.schedule.apply(queue, args)});
  }
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
    const outsideAngular = new Observable<T>(subscriber => {
      return this.zone.runOutsideAngular(() => {
        return obs$.subscribe(subscriber);
      });
    });
    return observeOn.call(outsideAngular, this);
  }
}