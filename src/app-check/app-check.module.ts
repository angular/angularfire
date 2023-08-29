import { isPlatformServer } from '@angular/common';
import { InjectionToken, Injector, ModuleWithProviders, NgModule, NgZone, Optional, PLATFORM_ID, isDevMode } from '@angular/core';
import { VERSION, ɵAPP_CHECK_PROVIDER_NAME, ɵAngularFireSchedulers, ɵAppCheckInstances, ɵgetDefaultInstanceOf } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { AppCheck as FirebaseAppCheck } from 'firebase/app-check';
import { AppCheck } from './app-check';

export const PROVIDED_APP_CHECK_INSTANCES = new InjectionToken<AppCheck[]>('angularfire2.app-check-instances');

export function defaultAppCheckInstanceFactory(provided: FirebaseAppCheck[]|undefined, defaultApp: FirebaseApp) {
  const defaultAppCheck = ɵgetDefaultInstanceOf<FirebaseAppCheck>(ɵAPP_CHECK_PROVIDER_NAME, provided, defaultApp);
  return defaultAppCheck && new AppCheck(defaultAppCheck);
}

const LOCALHOSTS = ['localhost', '0.0.0.0', '127.0.0.1'];
const isLocalhost = typeof window !== 'undefined' && LOCALHOSTS.includes(window.location.hostname);

export function appCheckInstanceFactory(fn: (injector: Injector) => FirebaseAppCheck) {
   return (zone: NgZone, injector: Injector, platformId: unknown) => {
    // Node should use admin token provider, browser devmode and localhost should use debug token
    if (!isPlatformServer(platformId) && (isDevMode() || isLocalhost)) {
      globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN ??= true;
    }
    const appCheck = zone.runOutsideAngular(() => fn(injector));
    return new AppCheck(appCheck);
  };
}

const APP_CHECK_INSTANCES_PROVIDER = {
  provide: ɵAppCheckInstances,
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

export function provideAppCheck(fn: (injector: Injector) => FirebaseAppCheck, ...deps: any[]): ModuleWithProviders<AppCheckModule> {
  return {
    ngModule: AppCheckModule,
    providers: [{
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
    }]
  };
}
