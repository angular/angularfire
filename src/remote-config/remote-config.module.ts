import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, Injector, APP_INITIALIZER } from '@angular/core';
import { RemoteConfig as FirebaseRemoteConfig, isSupported } from 'firebase/remote-config';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { RemoteConfig, RemoteConfigInstances, REMOTE_CONFIG_PROVIDER_NAME } from './remote-config';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';

export const PROVIDED_REMOTE_CONFIG_INSTANCES = new InjectionToken<RemoteConfig[]>('angularfire2.remote-config-instances');
export const IS_SUPPORTED = new InjectionToken<boolean>('angularfire2.remote-config.isSupported');

export const isSupportedValueSymbol = '__angularfire_symbol__remoteConfigIsSupportedValue';
export const isSupportedPromiseSymbol = '__angularfire_symbol__remoteConfigIsSupported';

globalThis[isSupportedPromiseSymbol] ||= isSupported().then(it => globalThis[isSupportedValueSymbol] ??= it);

export function defaultRemoteConfigInstanceFactory(
  isSupported: boolean,
  provided: FirebaseRemoteConfig[]|undefined,
  defaultApp: FirebaseApp,
) {
  if (!isSupported) { return null; }
  const defaultRemoteConfig = ɵgetDefaultInstanceOf<FirebaseRemoteConfig>(REMOTE_CONFIG_PROVIDER_NAME, provided, defaultApp);
  return defaultRemoteConfig && new RemoteConfig(defaultRemoteConfig);
}

export function remoteConfigInstanceFactory(fn: (injector: Injector) => FirebaseRemoteConfig) {
  return (zone: NgZone, isSupported: boolean, injector: Injector) => {
    if (!isSupported) { return null; }
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
    IS_SUPPORTED,
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
      useValue: () => globalThis[isSupportedPromiseSymbol],
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
      provide: IS_SUPPORTED,
      // TODO throw if this hasn't been resolved yet
      useFactory: () => globalThis[isSupportedValueSymbol],
    }, {
      provide: PROVIDED_REMOTE_CONFIG_INSTANCES,
      useFactory: remoteConfigInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        IS_SUPPORTED,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ]
    }]
  };
}
