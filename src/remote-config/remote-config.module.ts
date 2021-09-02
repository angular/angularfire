import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { RemoteConfig as FirebaseRemoteConfig } from 'firebase/remote-config';
import { ɵmemoizeInstance, ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { RemoteConfig, RemoteConfigInstances, REMOTE_CONFIG_PROVIDER_NAME } from './remote-config';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';

export const PROVIDED_REMOTE_CONFIG_INSTANCES = new InjectionToken<RemoteConfig[]>('angularfire2.remote-config-instances');

export function defaultRemoteConfigInstanceFactory(provided: FirebaseRemoteConfig[]|undefined, defaultApp: FirebaseApp) {
  const defaultRemoteConfig = ɵgetDefaultInstanceOf<FirebaseRemoteConfig>(REMOTE_CONFIG_PROVIDER_NAME, provided, defaultApp);
  return new RemoteConfig(defaultRemoteConfig);
}

export function remoteConfigInstanceFactory(fn: () => FirebaseRemoteConfig) {
  return (zone: NgZone) => {
    const remoteConfig = ɵmemoizeInstance<FirebaseRemoteConfig>(fn, zone);
    return new RemoteConfig(remoteConfig);
  };
}

const REMOTE_CONFIG_INSTANCES_PROVIDER = {
  provide: RemoteConfigInstances,
  deps: [
    [new Optional(), PROVIDED_REMOTE_CONFIG_INSTANCES ],
  ]
};

const DEFAULT_REMOTE_CONFIG_INSTANCE_PROVIDER = {
  provide: RemoteConfig,
  useFactory: defaultRemoteConfigInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_REMOTE_CONFIG_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_REMOTE_CONFIG_INSTANCE_PROVIDER,
    REMOTE_CONFIG_INSTANCES_PROVIDER,
  ]
})
export class RemoteConfigModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'rc');
  }
}

export function provideRemoteConfig(fn: () => FirebaseRemoteConfig): ModuleWithProviders<RemoteConfigModule> {
  return {
    ngModule: RemoteConfigModule,
    providers: [{
      provide: PROVIDED_REMOTE_CONFIG_INSTANCES,
      useFactory: remoteConfigInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
