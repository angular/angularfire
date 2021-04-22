import { Inject, InjectionToken, isDevMode, ModuleWithProviders, NgModule, NgZone, Optional, PLATFORM_ID, VERSION as NG_VERSION } from '@angular/core';
import { FirebaseApp as IFirebaseApp, getApps, getApp, initializeApp, registerVersion, FirebaseOptions } from 'firebase/app';
import { FIREBASE_OPTIONS, FIREBASE_APP_NAME, VERSION } from '@angular/fire/compat';
import isEqual from 'lodash.isequal';

export { FIREBASE_OPTIONS, FIREBASE_APP_NAME, VERSION };

// tslint:disable-next-line:no-empty-interface
export interface FirebaseApp extends IFirebaseApp {}

export class FirebaseApp {
  constructor(app: IFirebaseApp) {
    return app;
  }
}

export const DEFAULT_APP_NAME = '[DEFAULT]';
export const FIREBASE_APPS = new InjectionToken<Array<FirebaseApp>>('angularfire2.apps');

const IS_HMR = !!(module as any).hot;

export function ɵfirebaseAppFactory(options: FirebaseOptions, zone: NgZone, name: string | null ) {
  const appName = name || DEFAULT_APP_NAME;
  const existingApp = getApps().filter(app => app && app.name === appName)[0];
  const app = (existingApp || zone.runOutsideAngular(() => initializeApp(options, appName)));
  if (!isEqual(options, app.options)) {
    log('error', `${app.name} Firebase App already initialized with different options${IS_HMR ? ', you may need to reload as Firebase is not HMR aware.' : '.'}`);
  }
  return new FirebaseApp(app);
}

export function instanceFactory(zone: NgZone) {
  const { options, name }: { options: FirebaseOptions, name: string | null } = this;
  const appName = name || DEFAULT_APP_NAME;
  const existingApp = getApps().filter(app => app && app.name === appName)[0];
  const app = (existingApp || zone.runOutsideAngular(() => initializeApp(options, appName)));
  if (!isEqual(options, app.options)) {
    log('error', `${app.name} Firebase App already initialized with different options${IS_HMR ? ', you may need to reload as Firebase is not HMR aware.' : '.'}`);
  }
  return new FirebaseApp(app);
}

const log = (level: 'log'|'error'|'info'|'warn', ...args: any) => {
  if (isDevMode() && typeof console !== 'undefined') {
    console[level](...args);
  }
};

globalThis.ɵAngularfireInstanceCache ||= new Map();

export function ɵfetchInstance<T>(cacheKey: any, moduleName: string, appName: string, fn: () => T, deps: any): T {
  const [instance, cachedDeps] = globalThis.ɵAngularfireInstanceCache.get(cacheKey) || [];
  if (instance) {
    if (!isEqual(deps, cachedDeps)) {
      log('error', `${moduleName} was already initialized on the ${appName} Firebase App with different settings.${IS_HMR ? ' You may need to reload as Firebase is not HMR aware.' : ''}`);
    }
    return instance;
  } else {
    const newInstance = fn();
    globalThis.ɵAngularfireInstanceCache.set(cacheKey, [newInstance, deps]);
    return newInstance;
  }
}

export function ɵdefaultFirebaseAppFactory(_: FirebaseApp[]) {
  return getApp(DEFAULT_APP_NAME);
}

const FIREBASE_APP_PROVIDER = {
  provide: FirebaseApp,
  useFactory: ɵdefaultFirebaseAppFactory,
  deps: [
    [new Optional(), FIREBASE_APPS ]
  ]
};

@NgModule({
  providers: [
    FIREBASE_APP_PROVIDER
  ]
})
export class AngularFireModule {
  static initializeApp(options: FirebaseOptions, name?: string): ModuleWithProviders<AngularFireModule> {
    return {
      ngModule: AngularFireModule,
      providers: [{
        provide: FIREBASE_APPS,
        useFactory: instanceFactory.bind({ options, name }),
        multi: true,
        deps: [ NgZone ]
      }]
    };
  }

  // tslint:disable-next-line:ban-types
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    registerVersion('angularfire', VERSION.full, platformId.toString());
    registerVersion('angular', NG_VERSION.full);
  }
}
