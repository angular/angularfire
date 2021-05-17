import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { RemoteConfig as FirebaseRemoteConfig } from 'firebase/remote-config';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { RemoteConfig } from './remote-config';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const REMOTE_CONFIG_INSTANCES = new InjectionToken<RemoteConfig[]>('angularfire2.remote-config-instances');

const CACHE_PREFIX = 'RemoteConfig';

export function ɵdefaultRemoteConfigInstanceFactory(_: RemoteConfig[]) {
  const remoteConfig = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (remoteConfig) {
    return new RemoteConfig(remoteConfig);
  }
  throw new Error(`No RemoteConfig Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call provideRemoteConfig(...) in your providers list.`);
}

export function ɵwrapRemoteConfigInstanceInInjectable(remoteConfig: FirebaseRemoteConfig) {
  return new RemoteConfig(remoteConfig);
}

export function ɵremoteConfigInstancesFactory(instances: RemoteConfig[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundRemoteConfigInstanceFactory(zone: NgZone) {
  const remoteConfig = ɵsmartCacheInstance<FirebaseRemoteConfig>(CACHE_PREFIX, this, zone);
  return new RemoteConfig(remoteConfig);
}

const DEFAULT_REMOTE_CONFIG_INSTANCE_PROVIDER = {
  provide: RemoteConfig,
  useFactory: ɵdefaultRemoteConfigInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), REMOTE_CONFIG_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_REMOTE_CONFIG_INSTANCE_PROVIDER,
  ]
})
export class RemoteConfigModule {
}

export function provideRemoteConfig(fn: () => FirebaseRemoteConfig) {
  return {
    ngModule: RemoteConfigModule,
    providers: [{
      provide: REMOTE_CONFIG_INSTANCES,
      useFactory: ɵboundRemoteConfigInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), FIREBASE_APPS ]
      ]
    }]
  };
}
