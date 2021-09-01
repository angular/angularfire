import {
  InjectionToken,
  ModuleWithProviders,
  NgModule,
  NgZone,
  Optional,
  VERSION as NG_VERSION,
} from '@angular/core';
import { FirebaseApp as IFirebaseApp, getApp, registerVersion } from 'firebase/app';

import { FirebaseApp, FirebaseApps } from './app';
import { VERSION, ɵmemoizeInstance, ɵAngularFireSchedulers } from '@angular/fire';

export function defaultFirebaseAppFactory(provided: FirebaseApp[]|undefined) {
  // Use the provided app, if there is only one, otherwise fetch the default app
  if (provided && provided.length === 1) { return provided[0]; }
  return new FirebaseApp(getApp());
}

// With FIREBASE_APPS I wanted to capture the default app instance, if it is initialized by
// the reserved URL; ɵPROVIDED_FIREBASE_APPS is not for public consumption and serves to ensure that all
// provideFirebaseApp(...) calls are satisfied before FirebaseApp$ or FirebaseApp is resolved
export const PROVIDED_FIREBASE_APPS = new InjectionToken<Array<FirebaseApp>>('angularfire2._apps');

// Injecting FirebaseApp will now only inject the default Firebase App
// this allows allows beginners to import /__/firebase/init.js to auto initialize Firebase App
// from the reserved URL.
const DEFAULT_FIREBASE_APP_PROVIDER = {
  provide: FirebaseApp,
  useFactory: defaultFirebaseAppFactory,
  deps: [
    [new Optional(), PROVIDED_FIREBASE_APPS ],
  ],
};

const FIREBASE_APPS_PROVIDER = {
  provide: FirebaseApps,
  deps: [
    [new Optional(), PROVIDED_FIREBASE_APPS ],
  ],
};

export function firebaseAppFactory(fn: () => IFirebaseApp) {
  return (zone: NgZone) => {
    const app = ɵmemoizeInstance<IFirebaseApp>(fn, zone);
    return new FirebaseApp(app);
  };
}

@NgModule({
  providers: [
    DEFAULT_FIREBASE_APP_PROVIDER,
    FIREBASE_APPS_PROVIDER,
  ]
})
export class FirebaseAppModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'core');
    registerVersion('angular', NG_VERSION.full);
  }
}

// Calling initializeApp({ ... }, 'name') multiple times will add more FirebaseApps into the FIREBASE_APPS
// injection scope. This allows developers to more easily work with multiple Firebase Applications. Downside
// is that DI for app name and options doesn't really make sense anymore.
export function provideFirebaseApp(fn: () => IFirebaseApp): ModuleWithProviders<FirebaseAppModule> {
  return {
    ngModule: FirebaseAppModule,
    providers: [{
      provide: PROVIDED_FIREBASE_APPS,
      useFactory: firebaseAppFactory(fn),
      multi: true,
      deps: [ NgZone, ɵAngularFireSchedulers ],
    }],
  };
}
