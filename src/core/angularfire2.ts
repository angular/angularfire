import * as firebase from 'firebase/app';
import { FirebaseAppConfigToken, FirebaseApp, _firebaseAppFactory } from './firebase.app.module';
import { Injectable, InjectionToken, OpaqueToken, NgModule } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs/Scheduler';
import { queue } from 'rxjs/scheduler/queue';

export interface FirebaseAppConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  projectId?: string;
}

const FirebaseAppName = new InjectionToken<string>('FirebaseAppName');

export const FirebaseAppProvider = {
  provide: FirebaseApp,
  useFactory: _firebaseAppFactory,
  deps: [ FirebaseAppConfigToken, FirebaseAppName ]
};

@NgModule({
  providers: [ FirebaseAppProvider ],
})
export class AngularFireModule {
  static initializeApp(config: FirebaseAppConfig, appName?: string) {
    return {
      ngModule: AngularFireModule,
      providers: [
        { provide: FirebaseAppConfigToken, useValue: config },
        { provide: FirebaseAppName, useValue: appName }
      ]
    }
  }
}

/**
 * TODO: remove this scheduler once Rx has a more robust story for working
 * with zones.
 */
export class ZoneScheduler {
  constructor(public zone: Zone) {}

  schedule(...args: any[]): Subscription {
    return <Subscription>this.zone.run(() => queue.schedule.apply(queue, args));
  }
}

export { FirebaseApp, FirebaseAppName, FirebaseAppConfigToken };
