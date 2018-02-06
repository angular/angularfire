import { InjectionToken, NgZone, NgModule } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs/Scheduler';
import { queue } from 'rxjs/scheduler/queue';

import firebase from '@firebase/app';
import { FirebaseApp, FirebaseOptions } from '@firebase/app-types';

export function firebaseAppFactory(config: FirebaseOptions, name?: string): FirebaseApp {
  const appName = name || '[DEFAULT]';
  const existingApp = firebase.apps.filter(app => app.name == appName)[0];
  return existingApp || firebase.initializeApp(config, appName);
}

export const FirebaseAppName = new InjectionToken<string>('angularfire2.appName');
export const FirebaseAppConfig = new InjectionToken<FirebaseOptions>('angularfire2.config');

// Put in database.ts when we dropped depreciated
export const RealtimeDatabaseURL = new InjectionToken<string>('angularfire2.realtimeDatabaseURL');

export const FirebaseAppProvider = {
   provide: FirebaseApp,
   useFactory: firebaseAppFactory,
   deps: [ FirebaseAppConfig, FirebaseAppName ]
 };

 @NgModule({
   providers: [ FirebaseAppProvider ],
 })
 export class AngularFireModule {
   static initializeApp(config: FirebaseOptions, appName?: string) {
     return {
       ngModule: AngularFireModule,
       providers: [
         { provide: FirebaseAppConfig, useValue: config },
         { provide: FirebaseAppName, useValue: appName }
       ]
     }
   }
}

export class FirebaseZoneScheduler {
  constructor(public zone: NgZone) {}
  schedule(...args: any[]): Subscription {
    return <Subscription>this.zone.runGuarded(function() { return queue.schedule.apply(queue, args)});
  }
}