import { Injectable, InjectionToken, NgModule } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs/Scheduler';
import { queue } from 'rxjs/scheduler/queue';

import firebase from '@firebase/app';
import { FirebaseApp as FBApp, FirebaseOptions } from '@firebase/app-types';
import { FirebaseAuth } from '@firebase/auth-types';
import { FirebaseDatabase } from '@firebase/database-types';
import { FirebaseMessaging } from '@firebase/messaging-types';
import { FirebaseStorage } from '@firebase/storage-types';
import { FirebaseFirestore } from '@firebase/firestore-types';

export function firebaseAppFactory(config: FirebaseOptions, name?: string): FBApp {
  const appName = name || '[DEFAULT]';
  const existingApp = firebase.apps.filter(app => app.name == appName)[0];
  return existingApp || firebase.initializeApp(config, appName);
}

export class FirebaseApp implements FBApp {
  constructor() {
    console.warn('FirebaseApp will be depreciated in favor @firebase/auth-types/FirebaseApp');
  }
  name: string;
  options: {};
  auth: () => FirebaseAuth;
  database: () => FirebaseDatabase;
  messaging: () => FirebaseMessaging;
  storage: () => FirebaseStorage;
  delete: () => Promise<any>;
  firestore: () => FirebaseFirestore;
}

export const FirebaseAppName = new InjectionToken<string>('angularfire2.appName');
export const FirebaseAppConfig = new InjectionToken<FirebaseOptions>('angularfire2.config');

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
    console.warn('initializeApp will be depreciated in favor of the angularfire2/FirebaseAppConfig provider');
    return {
      ngModule: AngularFireModule,
      providers: [
        { provide: FirebaseAppConfig, useValue: config },
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

  // TODO: Correctly add ambient zone typings instead of using any.
  constructor(public zone: any) {}

  schedule(...args: any[]): Subscription {
    return <Subscription>this.zone.run(() => queue.schedule.apply(queue, args));
  }
}
