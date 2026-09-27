import { isPlatformServer } from '@angular/common';
import {
  EnvironmentProviders,
  InjectionToken,
  Injector,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  isDevMode,
  makeEnvironmentProviders,
} from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { AppCheck as FirebaseAppCheck } from 'firebase/app-check';
import { APP_CHECK_PROVIDER_NAME, AppCheck, AppCheckInstances } from './app-check';

export const PROVIDED_APP_CHECK_INSTANCES = new InjectionToken<(AppCheck|undefined)[]>('angularfire2.app-check-instances');

/**
 * Set to `true` in a server-only config to run `provideAppCheck` during server rendering.
 * By default App Check is skipped there, and `AppCheck` injects as `null`.
 */
export const APP_CHECK_ON_SERVER = new InjectionToken<boolean>('angularfire2.app-check-on-server', {
  providedIn: 'root',
  factory: () => false,
});

export function defaultAppCheckInstanceFactory(provided: (FirebaseAppCheck|undefined)[]|undefined, defaultApp: FirebaseApp) {
  // A skipped server render leaves an undefined entry, which ɵgetDefaultInstanceOf cannot read.
  const providedAppChecks = provided?.filter((appCheck): appCheck is FirebaseAppCheck => !!appCheck);
  const defaultAppCheck = ɵgetDefaultInstanceOf<FirebaseAppCheck>(APP_CHECK_PROVIDER_NAME, providedAppChecks, defaultApp);
  return defaultAppCheck && new AppCheck(defaultAppCheck);
}

const LOCALHOSTS = ['localhost', '0.0.0.0', '127.0.0.1'];
const isLocalhost = typeof window !== 'undefined' && LOCALHOSTS.includes(window.location.hostname);

let warnedServerSkip = false;

export function appCheckInstanceFactory(fn: (injector: Injector) => FirebaseAppCheck) {
   return (zone: NgZone, injector: Injector, platformId: unknown) => {
    if (isPlatformServer(platformId) && !injector.get(APP_CHECK_ON_SERVER)) {
      if (isDevMode() && !warnedServerSkip) {
        warnedServerSkip = true;
        console.warn("AngularFire skips App Check during server rendering, so server-side Firebase requests carry no App Check token. To run App Check there, provide APP_CHECK_ON_SERVER as true in your server config. Find more at https://github.com/angular/angularfire/blob/main/docs/app-check.md");
      }
      return undefined;
    }
    // Browser dev mode and localhost use the debug token
    if (!isPlatformServer(platformId) && (isDevMode() || isLocalhost)) {
      globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN ??= true;
    }
    const appCheck = zone.runOutsideAngular(() => fn(injector));
    return new AppCheck(appCheck);
  };
}

const APP_CHECK_INSTANCES_PROVIDER = {
  provide: AppCheckInstances,
  deps: [
    [new Optional(), PROVIDED_APP_CHECK_INSTANCES ],
  ]
};

const DEFAULT_APP_CHECK_INSTANCE_PROVIDER = {
  provide: AppCheck,
  useFactory: defaultAppCheckInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_APP_CHECK_INSTANCES ],
    FirebaseApp,
    PLATFORM_ID,
  ]
};

@NgModule({
  providers: [
    DEFAULT_APP_CHECK_INSTANCE_PROVIDER,
    APP_CHECK_INSTANCES_PROVIDER,
  ]
})
export class AppCheckModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'app-check');
  }
}

export function provideAppCheck(fn: (injector: Injector) => FirebaseAppCheck, ...deps: any[]): EnvironmentProviders {
  registerVersion('angularfire', VERSION.full, 'app-check');
  return makeEnvironmentProviders([
    DEFAULT_APP_CHECK_INSTANCE_PROVIDER,
    APP_CHECK_INSTANCES_PROVIDER,
    {
      provide: PROVIDED_APP_CHECK_INSTANCES,
      useFactory: appCheckInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        PLATFORM_ID,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ]
    }
  ]);
}
