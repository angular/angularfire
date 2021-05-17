import {
  Inject,
  InjectionToken,
  ModuleWithProviders,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  VERSION as NG_VERSION,
} from '@angular/core';
import { FirebaseApp as IFirebaseApp, getApps, getApp, registerVersion } from 'firebase/app';

import { FirebaseApp } from './app';
import { VERSION, ɵsmartCacheInstance } from '../core';
import { ɵAngularFireSchedulers } from '../zones';

export const DEFAULT_APP_NAME = '[DEFAULT]';
export const FIREBASE_APPS = new InjectionToken<Array<FirebaseApp>>('angularfire2.apps');

export function ɵdefaultFirebaseAppFactory(_: FirebaseApp[]) {
  return new FirebaseApp(getApp(DEFAULT_APP_NAME));
}

export function ɵwrapFirebaseAppInInjectable(app: IFirebaseApp) {
  return new FirebaseApp(app);
}

export function ɵfirebaseAppsFactory(_: FirebaseApp[]) {
  return getApps().map(ɵwrapFirebaseAppInInjectable);
}

// With FIREBASE_APPS I wanted to capture the default app instance, if it is initialized by
// the reserved URL; INTERNAL_FIREBASE_APPS is not exported and serves to ensure that all
// provideFirebaseApp(...) calls are satisfied before FIREBASE_APPS or FirebaseApp is resolved
const INTERNAL_FIREBASE_APPS = new InjectionToken<Array<FirebaseApp>>('angularfire2._apps');

// Injecting FirebaseApp will now only inject the default Firebase App
// this allows allows beginners to import /__/firebase/init.js to auto initialize Firebase App
// from the reserved URL.
const DEFAULT_FIREBASE_APP_PROVIDER = {
  provide: FirebaseApp,
  useFactory: ɵdefaultFirebaseAppFactory,
  deps: [
    [new Optional(), INTERNAL_FIREBASE_APPS ],
  ],
};

const FIREBASE_APPS_PROVIDER = {
  provide: FIREBASE_APPS,
  useFactory: ɵfirebaseAppsFactory,
  deps: [
    [new Optional(), INTERNAL_FIREBASE_APPS ],
  ],
};

const CACHE_PREFIX = 'FirebaseApp';

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundFirebaseAppFactory(zone: NgZone) {
  const app = ɵsmartCacheInstance<IFirebaseApp>(CACHE_PREFIX, this, zone);
  return new FirebaseApp(app);
}

@NgModule({
  providers: [
    DEFAULT_FIREBASE_APP_PROVIDER,
    FIREBASE_APPS_PROVIDER,
  ]
})
export class AngularFireModule {
  // tslint:disable-next-line:ban-types
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    registerVersion('angularfire', VERSION.full, platformId.toString());
    registerVersion('angular', NG_VERSION.full);
  }
}

// Calling initializeApp({ ... }, 'name') multiple times will add more FirebaseApps into the FIREBASE_APPS
// injection scope. This allows developers to more easily work with multiple Firebase Applications. Downside
// is that DI for app name and options doesn't really make sense anymore.
export function provideFirebaseApp(fn: () => IFirebaseApp): ModuleWithProviders<AngularFireModule> {
  return {
    ngModule: AngularFireModule,
    providers: [{
      provide: INTERNAL_FIREBASE_APPS,
      useFactory: ɵboundFirebaseAppFactory.bind(fn),
      multi: true,
      deps: [ NgZone, ɵAngularFireSchedulers ],
    }],
  };
}
