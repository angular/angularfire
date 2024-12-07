import {
  EnvironmentProviders,
  InjectionToken,
  Injector,
  NgModule,
  NgZone,
  Optional,
  makeEnvironmentProviders,
} from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { DATA_CONNECT_PROVIDER_NAME, DataConnect, DataConnectInstances } from './data-connect';

const PROVIDED_DATA_CONNECT_INSTANCES = new InjectionToken<DataConnect[]>('angularfire2.data-connect-instances');

export function defaultDataConnectInstanceFactory(provided: DataConnect[]|undefined, defaultApp: FirebaseApp) {
  return ɵgetDefaultInstanceOf<DataConnect>(DATA_CONNECT_PROVIDER_NAME, provided, defaultApp);
}

export function dataConnectInstanceFactory(fn: (injector: Injector) => DataConnect) {
  return (zone: NgZone, injector: Injector) => {
    return zone.runOutsideAngular(() => fn(injector));
  };
}

const DATA_CONNECT_INSTANCES_PROVIDER = {
  provide: DataConnectInstances,
  deps: [
    [new Optional(), PROVIDED_DATA_CONNECT_INSTANCES ],
  ]
};

const DEFAULT_DATA_CONNECT_INSTANCE_PROVIDER = {
  provide: DataConnect,
  useFactory: defaultDataConnectInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_DATA_CONNECT_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_DATA_CONNECT_INSTANCE_PROVIDER,
    DATA_CONNECT_INSTANCES_PROVIDER,
  ]
})
export class DataConnectModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'fdc');
  }
}

export function provideDataConnect(fn: (injector: Injector) => DataConnect, ...deps: any[]): EnvironmentProviders {
  registerVersion('angularfire', VERSION.full, 'fdc');

  return makeEnvironmentProviders([
    DEFAULT_DATA_CONNECT_INSTANCE_PROVIDER,
    DATA_CONNECT_INSTANCES_PROVIDER,
    {
      provide: PROVIDED_DATA_CONNECT_INSTANCES,
      useFactory: dataConnectInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ],
    }
  ]);
}
