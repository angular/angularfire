import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { StorageService as FirebaseStorage } from 'firebase/storage';

import { ɵgetDefaultInstanceOf, ɵmemoizeInstance } from '../core';
import { Storage, StorageInstances, STORAGE_PROVIDER_NAME } from './storage';
import { PROVIDED_FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const PROVIDED_STORAGE_INSTANCES = new InjectionToken<Storage[]>('angularfire2.storage-instances');

export function ɵdefaultStorageInstanceFactory(_: Storage[]) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseStorage>(STORAGE_PROVIDER_NAME);
  return new Storage(defaultAuth);
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundStorageInstanceFactory(zone: NgZone) {
  const storage = ɵmemoizeInstance<FirebaseStorage>(this, zone);
  return new Storage(storage);
}


const STORAGE_INSTANCES_PROVIDER = {
  provide: StorageInstances,
  deps: [
    [new Optional(), PROVIDED_STORAGE_INSTANCES ],
  ]
};

const DEFAULT_STORAGE_INSTANCE_PROVIDER = {
  provide: Storage,
  useFactory: ɵdefaultStorageInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), PROVIDED_STORAGE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_STORAGE_INSTANCE_PROVIDER,
  ]
})
export class StorageModule {
}

export function provideStorage(fn: () => FirebaseStorage): ModuleWithProviders<StorageModule> {
  return {
    ngModule: StorageModule,
    providers: [{
      provide: PROVIDED_STORAGE_INSTANCES,
      useFactory: ɵboundStorageInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), PROVIDED_FIREBASE_APPS ]
      ]
    }]
  };
}
