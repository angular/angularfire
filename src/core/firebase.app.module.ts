import {
  InjectionToken,
  isDevMode,
  ModuleWithProviders,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  VERSION as NG_VERSION,
  Version,
} from '@angular/core';
import { FirebaseApp as FirebaseAppType, FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';
import { getApps, initializeApp, registerVersion } from 'firebase/app';

// tslint:disable-next-line:no-empty-interface
export interface FirebaseApp extends FirebaseAppType { }
export class FirebaseApp { }

export const FIREBASE_OPTIONS = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FIREBASE_APP_NAME = new InjectionToken<string | FirebaseAppConfig | undefined>('angularfire2.app.name');
export const AUTOMATIC_DATA_COLLECTION_ENABLED = new InjectionToken<boolean|undefined>('angularfire2.app.nameOrConfig');

export const VERSION = new Version('ANGULARFIRE2_VERSION');

export function ɵfirebaseAppFactory(
  options: FirebaseOptions,
  zone: NgZone,
  platformId: object,
  name: string = '[DEFAULT]',
  injectedAutomaticDataCollectionEnabled: boolean|null
) {
  const automaticDataCollectionEnabled = injectedAutomaticDataCollectionEnabled ?? true; // optional, default to true
  const app = getApps().find(app => app.name === name) ||
      zone.runOutsideAngular(() => {
        const ret = initializeApp(options, name);
        ret.automaticDataCollectionEnabled = automaticDataCollectionEnabled;
        return ret;
      });
  try {
    if (JSON.stringify(options) !== JSON.stringify(app.options) || app.automaticDataCollectionEnabled !== automaticDataCollectionEnabled) {
      const hmr = !!(module as any).hot;
      log('error', `${name} Firebase App already initialized with different options${hmr ? ', you may need to reload as Firebase is not HMR aware.' : '.'}`);
    }
  } catch (e) { }
  registerVersion('angularfire', VERSION.full, platformId.toString());
  registerVersion('angular', NG_VERSION.full);
  return app;
}

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    console[level](...args);
  }
};

globalThis.ɵAngularfireInstanceCache ||= new Map();

export function ɵfetchInstance<T>(cacheKey: any, moduleName: string, app: FirebaseAppType, fn: () => T, args: any[]): T {
  const [instance, ...cachedArgs] = globalThis.ɵAngularfireInstanceCache.get(cacheKey) || [];
  if (instance) {
    try {
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
    } catch (e) { }
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
    PLATFORM_ID,
    [new Optional(), FIREBASE_APP_NAME],
    [new Optional(), AUTOMATIC_DATA_COLLECTION_ENABLED],
  ]
};

@NgModule({
  providers: [FIREBASE_APP_PROVIDER]
})
export class AngularFireModule {
  static initializeApp(options: FirebaseOptions, name?: string): ModuleWithProviders<AngularFireModule> {
    return {
      ngModule: AngularFireModule,
      providers: [
        {provide: FIREBASE_OPTIONS, useValue: options},
        {provide: FIREBASE_APP_NAME, useValue: name}
      ]
    };
  }
}
