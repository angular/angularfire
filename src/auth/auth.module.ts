import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, PLATFORM_ID } from '@angular/core';
import { Auth as FirebaseAuth } from 'firebase/auth';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Auth, AuthInstances, AUTH_PROVIDER_NAME } from './auth';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';

export const PROVIDED_AUTH_INSTANCES = new InjectionToken<Auth[]>('angularfire2.auth-instances');

export function defaultAuthInstanceFactory(provided: FirebaseAuth[]|undefined, defaultApp: FirebaseApp) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseAuth>(AUTH_PROVIDER_NAME, provided, defaultApp);
  return new Auth(defaultAuth);
}

export function authInstanceFactory(fn: () => FirebaseAuth) {
  return (zone: NgZone) => {
    return ɵmemoizeInstance<FirebaseAuth>(fn, zone);
  };
}

const AUTH_INSTANCES_PROVIDER = {
  provide: AuthInstances,
  deps: [
    [new Optional(), PROVIDED_AUTH_INSTANCES ],
  ]
};

const DEFAULT_AUTH_INSTANCE_PROVIDER = {
  provide: Auth,
  useFactory: defaultAuthInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_AUTH_INSTANCES ],
    FirebaseApp,
    PLATFORM_ID,
  ]
};

@NgModule({
  providers: [
    DEFAULT_AUTH_INSTANCE_PROVIDER,
    AUTH_INSTANCES_PROVIDER,
  ]
})
export class AuthModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'auth');
  }
}

export function provideAuth(fn: () => FirebaseAuth): ModuleWithProviders<AuthModule> {
  return {
    ngModule: AuthModule,
    providers: [{
      provide: PROVIDED_AUTH_INSTANCES,
      useFactory: authInstanceFactory(fn),
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
