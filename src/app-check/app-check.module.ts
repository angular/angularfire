import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, PLATFORM_ID } from '@angular/core';
import { AppCheck as FirebaseAppCheck } from 'firebase/app-check';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { AppCheck, AppCheckInstances, APP_CHECK_PROVIDER_NAME } from './app-check';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';

export const PROVIDED_APP_CHECK_INSTANCES = new InjectionToken<AppCheck[]>('angularfire2.app-check-instances');
export const APP_CHECK_NAMESPACE_SYMBOL = Symbol('angularfire2.app-check.namespace');

export function defaultAppCheckInstanceFactory(provided: FirebaseAppCheck[]|undefined, defaultApp: FirebaseApp) {
  const defaultAppCheck = ɵgetDefaultInstanceOf<FirebaseAppCheck>(APP_CHECK_PROVIDER_NAME, provided, defaultApp);
  return new AppCheck(defaultAppCheck);
}

export function appCheckInstanceFactory(fn: () => FirebaseAppCheck) {
  return (zone: NgZone) => {
    return ɵmemoizeInstance<FirebaseAppCheck>(fn, zone);
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

export function provideAppCheck(fn: () => FirebaseAppCheck): ModuleWithProviders<AppCheckModule> {
  return {
    ngModule: AppCheckModule,
    providers: [{
      provide: PROVIDED_APP_CHECK_INSTANCES,
      useFactory: appCheckInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        PLATFORM_ID,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
