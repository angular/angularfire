import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { Auth as FirebaseAuth } from 'firebase/auth';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { Auth } from './auth';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const AUTH_INSTANCES = new InjectionToken<Auth[]>('angularfire2.auth-instances');

const CACHE_PREFIX = 'Auth';

export function ɵdefaultAuthInstanceFactory(_: Auth[]) {
  const auth = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (auth) {
    return new Auth(auth);
  }
  throw new Error(`No Auth Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call provideAuth(...) in your providers list.`);
}

export function ɵwrapAuthInstanceInInjectable(auth: FirebaseAuth) {
  return new Auth(auth);
}

export function ɵauthInstancesFactory(instances: Auth[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundAuthInstanceFactory(zone: NgZone) {
  const auth = ɵsmartCacheInstance<FirebaseAuth>(CACHE_PREFIX, this, zone);
  return new Auth(auth);
}

const DEFAULT_AUTH_INSTANCE_PROVIDER = {
  provide: Auth,
  useFactory: ɵdefaultAuthInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), AUTH_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_AUTH_INSTANCE_PROVIDER,
  ]
})
export class AuthModule {
}

export function provideAuth(fn: () => FirebaseAuth) {
  return {
    ngModule: AuthModule,
    providers: [{
      provide: AUTH_INSTANCES,
      useFactory: ɵboundAuthInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), FIREBASE_APPS ]
      ]
    }]
  };
}
