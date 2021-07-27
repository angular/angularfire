import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { Auth as FirebaseAuth, initializeAuth } from 'firebase/auth';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers } from '@angular/fire';
import { Auth, AuthInstances, AUTH_PROVIDER_NAME } from './auth';
import { getApp } from 'firebase/app';
import { FirebaseApps } from '@angular/fire/app';

export const PROVIDED_AUTH_INSTANCES = new InjectionToken<Auth[]>('angularfire2.auth-instances');

export function defaultAuthInstanceFactory() {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseAuth>(AUTH_PROVIDER_NAME) || initializeAuth(getApp());
  return new Auth(defaultAuth);
}

export function authInstanceFactory(fn: () => FirebaseAuth) {
  return (zone: NgZone) => {
    const auth = ɵmemoizeInstance<FirebaseAuth>(fn, zone);
    return new Auth(auth);
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
    NgZone,
    [new Optional(), PROVIDED_AUTH_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_AUTH_INSTANCE_PROVIDER,
    AUTH_INSTANCES_PROVIDER,
  ]
})
export class AuthModule {
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
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
