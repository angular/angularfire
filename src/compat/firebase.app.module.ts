import {
  Inject, InjectionToken, ModuleWithProviders, VERSION as NG_VERSION, NgModule, NgZone, Optional, PLATFORM_ID, isDevMode
} from '@angular/core';
import { VERSION } from '@angular/fire';
import { FirebaseAppSettings, FirebaseOptions } from 'firebase/app';
import firebase from 'firebase/compat/app';
import { FirebaseApp } from './firebase.app';

export const FIREBASE_OPTIONS = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FIREBASE_APP_NAME = new InjectionToken<string | undefined>('angularfire2.app.name');


export function ɵfirebaseAppFactory(options: FirebaseOptions, zone: NgZone, nameOrConfig?: string | FirebaseAppSettings | null) {
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
  } catch (e) { /* empty */ }
  return new FirebaseApp(app);
}

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    // eslint-disable-next-line no-console
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
  static initializeApp(options: FirebaseOptions, nameOrConfig?: string | FirebaseAppSettings): ModuleWithProviders<AngularFireModule> {
    return {
      ngModule: AngularFireModule,
      providers: [
        {provide: FIREBASE_OPTIONS, useValue: options},
        {provide: FIREBASE_APP_NAME, useValue: nameOrConfig}
      ]
    };
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    firebase.registerVersion('angularfire', VERSION.full, 'core');
    firebase.registerVersion('angularfire', VERSION.full, 'app-compat');
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    firebase.registerVersion('angular', NG_VERSION.full, platformId.toString());
  }
}
