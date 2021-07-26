import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { Auth as FirebaseAuth } from 'firebase/auth';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance } from '../core';
import { Auth, AuthInstances, AUTH_PROVIDER_NAME } from './auth';
import { ɵAngularFireSchedulers } from '../zones';
import { PROVIDED_FIREBASE_APPS } from '../app/app.module';

export const PROVIDED_AUTH_INSTANCES = new InjectionToken<Auth[]>('angularfire2.auth-instances');

export function ɵdefaultAuthInstanceFactory() {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseAuth>(AUTH_PROVIDER_NAME);
  return new Auth(defaultAuth);
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundAuthInstanceFactory(zone: NgZone) {
  const auth = ɵmemoizeInstance<FirebaseAuth>(this, zone);
  return new Auth(auth);
}

const AUTH_INSTANCES_PROVIDER = {
  provide: AuthInstances,
  deps: [
    [new Optional(), PROVIDED_AUTH_INSTANCES ],
  ]
};

const DEFAULT_AUTH_INSTANCE_PROVIDER = {
  provide: Auth,
  useFactory: ɵdefaultAuthInstanceFactory,
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
      useFactory: ɵboundAuthInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), PROVIDED_FIREBASE_APPS ]
      ]
    }]
  };
}
