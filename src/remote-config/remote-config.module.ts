import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, Injector, APP_INITIALIZER } from '@angular/core';
import { RemoteConfig as FirebaseRemoteConfig } from 'firebase/remote-config';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION, ɵisRemoteConfigSupportedFactory } from '@angular/fire';
import { RemoteConfig, RemoteConfigInstances, REMOTE_CONFIG_PROVIDER_NAME } from './remote-config';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';

export const PROVIDED_REMOTE_CONFIG_INSTANCES = new InjectionToken<RemoteConfig[]>('angularfire2.remote-config-instances');

export function defaultRemoteConfigInstanceFactory(
  provided: FirebaseRemoteConfig[]|undefined,
  defaultApp: FirebaseApp,
) {
  if (!ɵisRemoteConfigSupportedFactory.sync()) { return null; }
  const defaultRemoteConfig = ɵgetDefaultInstanceOf<FirebaseRemoteConfig>(REMOTE_CONFIG_PROVIDER_NAME, provided, defaultApp);
  return defaultRemoteConfig && new RemoteConfig(defaultRemoteConfig);
}

export function remoteConfigInstanceFactory(fn: (injector: Injector) => FirebaseRemoteConfig) {
  return (zone: NgZone, injector: Injector) => {
    if (!ɵisRemoteConfigSupportedFactory.sync()) { return null; }
    const remoteConfig = zone.runOutsideAngular(() => fn(injector));
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
    {
      provide: APP_INITIALIZER,
      useValue: ɵisRemoteConfigSupportedFactory.async,
      multi: true,
    },
  ]
})
export class RemoteConfigModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'rc');
  }
}

export function provideRemoteConfig(fn: () => FirebaseRemoteConfig, ...deps: any[]): ModuleWithProviders<RemoteConfigModule> {
  return {
    ngModule: RemoteConfigModule,
    providers: [{
      provide: PROVIDED_REMOTE_CONFIG_INSTANCES,
      useFactory: remoteConfigInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ]
    }]
  };
}
