import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { StorageService as FirebaseStorage } from 'firebase/storage';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { Storage } from './storage';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';

export const STORAGE_INSTANCES = new InjectionToken<Storage[]>('angularfire2.storage-instances');

const CACHE_PREFIX = 'Storage';

export function ɵdefaultStorageInstanceFactory(_: Storage[]) {
  const storage = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (storage) {
    return new Storage(storage);
  }
  throw new Error(`No StorageService Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call provideStorage(...) in your providers list.`);
}

export function ɵwrapStorageInstanceInInjectable(storage: FirebaseStorage) {
  return new Storage(storage);
}

export function ɵstorageInstancesFactory(instances: Storage[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundStorageInstanceFactory(zone: NgZone) {
  const storage = ɵsmartCacheInstance<FirebaseStorage>(CACHE_PREFIX, this);
  return new Storage(storage);
}

const DEFAULT_STORAGE_INSTANCE_PROVIDER = {
  provide: Storage,
  useFactory: ɵdefaultStorageInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), STORAGE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_STORAGE_INSTANCE_PROVIDER,
  ]
})
export class StorageModule {
}

export function provideStorage(fn: () => FirebaseStorage) {
  return {
    ngModule: StorageModule,
    providers: [{
      provide: STORAGE_INSTANCES,
      useFactory: ɵboundStorageInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        [new Optional(), FIREBASE_APPS ]
      ]
    }]
  };
}
