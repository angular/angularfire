import {
  EnvironmentProviders,
  Inject,
  InjectionToken,
  Injector,
  VERSION as NG_VERSION,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  makeEnvironmentProviders,
} from '@angular/core';
import { VERSION, ɵAngularFireSchedulers } from '@angular/fire';
import { FirebaseApp as IFirebaseApp, getApp, registerVersion } from 'firebase/app';
import { FirebaseApp, FirebaseApps } from './app';

export function defaultFirebaseAppFactory(provided: FirebaseApp[]|undefined) {
  // Use the provided app, if there is only one, otherwise fetch the default app
  if (provided && provided.length === 1) { return provided[0]; }
  return new FirebaseApp(getApp());
}

// With FIREBASE_APPS I wanted to capture the default app instance, if it is initialized by
// the reserved URL; ɵPROVIDED_FIREBASE_APPS is not for public consumption and serves to ensure that all
// provideFirebaseApp(...) calls are satisfied before FirebaseApp$ or FirebaseApp is resolved
export const PROVIDED_FIREBASE_APPS = new InjectionToken<FirebaseApp[]>('angularfire2._apps');

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

export function firebaseAppFactory(fn: (injector: Injector) => IFirebaseApp) {
  return (zone: NgZone, injector: Injector) => {
    const platformId = injector.get(PLATFORM_ID);
    registerVersion('angularfire', VERSION.full, 'core');
    registerVersion('angularfire', VERSION.full, 'app');
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    registerVersion('angular', NG_VERSION.full, platformId.toString());

    const app = zone.runOutsideAngular(() => fn(injector));
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
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    registerVersion('angularfire', VERSION.full, 'core');
    registerVersion('angularfire', VERSION.full, 'app');
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    registerVersion('angular', NG_VERSION.full, platformId.toString());
  }
}

// Calling initializeApp({ ... }, 'name') multiple times will add more FirebaseApps into the FIREBASE_APPS
// injection scope. This allows developers to more easily work with multiple Firebase Applications. Downside
// is that DI for app name and options doesn't really make sense anymore.
export function provideFirebaseApp(fn: (injector: Injector) => IFirebaseApp, ...deps: any[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    DEFAULT_FIREBASE_APP_PROVIDER,
    FIREBASE_APPS_PROVIDER,
    {
      provide: PROVIDED_FIREBASE_APPS,
      useFactory: firebaseAppFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        ...deps,
      ],
    }
  ])
}
