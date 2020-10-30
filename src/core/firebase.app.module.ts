import {
  Inject, InjectionToken, ModuleWithProviders, NgModule, NgZone, Optional, PLATFORM_ID, VERSION as NG_VERSION, Version
} from '@angular/core';
import firebase from 'firebase/app';

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
export class FirebaseApp implements Partial<firebase.app.App> {
  name: string;
  options: {};
  analytics: () => firebase.analytics.Analytics;
  auth: () => firebase.auth.Auth;
  database: (databaseURL?: string) => firebase.database.Database;
  messaging: () => firebase.messaging.Messaging;
  performance: () => firebase.performance.Performance;
  storage: (storageBucket?: string) => firebase.storage.Storage;
  delete: () => Promise<void>;
  firestore: () => firebase.firestore.Firestore;
  functions: (region?: string) => firebase.functions.Functions;
  remoteConfig: () => firebase.remoteConfig.RemoteConfig;
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
  static initializeApp(options: FirebaseOptions, nameOrConfig?: string | FirebaseAppConfig): ModuleWithProviders<AngularFireModule> {
    return {
      ngModule: AngularFireModule,
      providers: [
        {provide: FIREBASE_OPTIONS, useValue: options},
        {provide: FIREBASE_APP_NAME, useValue: nameOrConfig}
      ]
    };
  }

  // tslint:disable-next-line:ban-types
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    firebase.registerVersion('angularfire', VERSION.full, platformId.toString());
    firebase.registerVersion('angular', NG_VERSION.full);
  }
}
