import { Inject, InjectionToken, NgModule, NgZone, Optional, PLATFORM_ID, VERSION as NG_VERSION, Version } from '@angular/core';
import * as firebase from 'firebase/app';
import { analytics, app, auth, database, firestore, functions, messaging, performance, remoteConfig, storage } from 'firebase/app';

// INVESTIGATE Public types don't expose FirebaseOptions or FirebaseAppConfig, is this the case anylonger?
export interface FirebaseOptions {
  [key: string]: any;
}

export interface FirebaseAppConfig {
  [key: string]: any;
}

export const FIREBASE_OPTIONS = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FIREBASE_APP_NAME = new InjectionToken<string | FirebaseAppConfig | undefined>('angularfire2.app.nameOrConfig');

// Have to implement as we need to return a class from the provider, we should consider exporting
// this in the firebase/app types as this is our highest risk of breaks
export class FirebaseApp implements Partial<app.App> {
  name: string;
  options: {};
  analytics: () => analytics.Analytics;
  auth: () => auth.Auth;
  database: (databaseURL?: string) => database.Database;
  messaging: () => messaging.Messaging;
  performance: () => performance.Performance;
  storage: (storageBucket?: string) => storage.Storage;
  delete: () => Promise<void>;
  firestore: () => firestore.Firestore;
  functions: (region?: string) => functions.Functions;
  remoteConfig: () => remoteConfig.RemoteConfig;
}

export const VERSION = new Version('ANGULARFIRE2_VERSION');

export function ɵfirebaseAppFactory(options: FirebaseOptions, zone: NgZone, nameOrConfig?: string | FirebaseAppConfig | null) {
  const name = typeof nameOrConfig === 'string' && nameOrConfig || '[DEFAULT]';
  const config = typeof nameOrConfig === 'object' && nameOrConfig || {};
  config.name = config.name || name;
  // Added any due to some inconsistency between @firebase/app and firebase types
  const existingApp = firebase.apps.filter(app => app && app.name === config.name)[0] as any;
  // We support FirebaseConfig, initializeApp's public type only accepts string; need to cast as any
  // Could be solved with https://github.com/firebase/firebase-js-sdk/pull/1206
  return (existingApp || zone.runOutsideAngular(() => firebase.initializeApp(options, config as any))) as FirebaseApp;
}

const FIREBASE_APP_PROVIDER = {
  provide: FirebaseApp,
  useFactory: ɵfirebaseAppFactory,
  deps: [
    FIREBASE_OPTIONS,
    NgZone,
    [new Optional(), FIREBASE_APP_NAME]
  ]
};

@NgModule({
  providers: [FIREBASE_APP_PROVIDER]
})
export class AngularFireModule {
  static initializeApp(options: FirebaseOptions, nameOrConfig?: string | FirebaseAppConfig) {
    return {
      ngModule: AngularFireModule,
      providers: [
        { provide: FIREBASE_OPTIONS, useValue: options },
        { provide: FIREBASE_APP_NAME, useValue: nameOrConfig }
      ]
    };
  }

  // tslint:disable-next-line:ban-types
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    firebase.registerVersion('angularfire', VERSION.full, platformId.toString());
    firebase.registerVersion('angular', NG_VERSION.full);
  }
}
