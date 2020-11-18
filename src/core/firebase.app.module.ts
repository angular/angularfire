import {
  Inject, InjectionToken, isDevMode, ModuleWithProviders, NgModule, NgZone, Optional, PLATFORM_ID, VERSION as NG_VERSION, Version
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
  const app = (existingApp || zone.runOutsideAngular(() => firebase.initializeApp(options, config as any))) as FirebaseApp;
  if (JSON.stringify(options) !== JSON.stringify(app.options)) {
    const hmr = !!(module as any).hot;
    log('error', `${app.name} Firebase App already initialized with different options${hmr ? ', you may need to reload as Firebase is not HMR aware.' : '.'}`);
  }
  return app;
}

export const ɵlogAuthEmulatorError = () => {
  // TODO sort this out, https://github.com/angular/angularfire/issues/2656
  log('warn', 'You may need to import \'firebase/auth\' manually in your component rather than rely on AngularFireAuth\'s dynamic import, when using the emulator suite https://github.com/angular/angularfire/issues/2656');
};

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    console[level](...args);
  }
};

globalThis.ɵAngularfireInstanceCache ||= new Map();

export function ɵfetchInstance<T>(cacheKey: any, moduleName: string, app: FirebaseApp, fn: () => T, args: any[]): T {
  const [instance, ...cachedArgs] = globalThis.ɵAngularfireInstanceCache.get(cacheKey) || [];
  if (instance) {
    if (args.some((arg, i) => {
      const cachedArg = cachedArgs[i];
      if (arg && typeof arg === 'object') {
        return JSON.stringify(arg) !== JSON.stringify(cachedArg);
      } else {
        return arg !== cachedArg;
      }
    })) {
      const hmr = !!(module as any).hot;
      log('error', `${moduleName} was already initialized on the ${app.name} Firebase App instance with different settings.${hmr ? ' You may need to reload as Firebase is not HMR aware.' : ''}`);
    }
    return instance;
  } else {
    const newInstance = fn();
    globalThis.ɵAngularfireInstanceCache.set(cacheKey, [newInstance, ...args]);
    return newInstance;
  }
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
