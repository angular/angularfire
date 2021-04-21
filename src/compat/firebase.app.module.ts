import {
  InjectionToken, Inject, isDevMode, ModuleWithProviders, NgModule, NgZone, Optional, PLATFORM_ID, VERSION as NG_VERSION, Version
} from '@angular/core';
import firebase from 'firebase/compat/app';
import { FirebaseOptions, FirebaseAppConfig } from 'firebase/app';

export const FIREBASE_OPTIONS = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FIREBASE_APP_NAME = new InjectionToken<string | undefined>('angularfire2.app.name');

export const VERSION = new Version('ANGULARFIRE2_VERSION');

// tslint:disable-next-line:no-empty-interface
export interface FirebaseApp extends firebase.app.App {}

export class FirebaseApp {
  constructor(app: firebase.app.App) {
    return app;
  }
}

export function ɵfirebaseAppFactory(options: FirebaseOptions, zone: NgZone, nameOrConfig?: string | FirebaseAppConfig | null) {
  const name = typeof nameOrConfig === 'string' && nameOrConfig || '[DEFAULT]';
  const config = typeof nameOrConfig === 'object' && nameOrConfig || {};
  config.name = config.name || name;
  // Added any due to some inconsistency between @firebase/app and firebase types
  const existingApp = firebase.apps.filter(app => app && app.name === config.name)[0];
  // We support FirebaseConfig, initializeApp's public type only accepts string; need to cast as any
  // Could be solved with https://github.com/firebase/firebase-js-sdk/pull/1206
  const app = (existingApp || zone.runOutsideAngular(() => firebase.initializeApp(options, config as any)));
  try {
    if (JSON.stringify(options) !== JSON.stringify(app.options)) {
      const hmr = !!(module as any).hot;
      log('error', `${app.name} Firebase App already initialized with different options${hmr ? ', you may need to reload as Firebase is not HMR aware.' : '.'}`);
    }
  } catch (e) { }
  return new FirebaseApp(app);
}

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    console[level](...args);
  }
};

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
    firebase.registerVersion('angularfire', VERSION.full, `compat-${platformId.toString()}`);
    firebase.registerVersion('angular', NG_VERSION.full);
  }
}
