import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { getStorage, StorageService as FirebaseStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers } from '@angular/fire';
import { Storage, StorageInstances, STORAGE_PROVIDER_NAME } from './storage';
import { FirebaseApps } from '@angular/fire/app';

export const PROVIDED_STORAGE_INSTANCES = new InjectionToken<Storage[]>('angularfire2.storage-instances');

export function defaultStorageInstanceFactory(_: Storage[]) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseStorage>(STORAGE_PROVIDER_NAME) || getStorage(getApp());
  return new Storage(defaultAuth);
}

export function storageInstanceFactory(fn: () => FirebaseStorage) {
  return (zone: NgZone) => {
    const storage = ɵmemoizeInstance<FirebaseStorage>(fn, zone);
    return new Storage(storage);
  };
}

const STORAGE_INSTANCES_PROVIDER = {
  provide: StorageInstances,
  deps: [
    [new Optional(), PROVIDED_STORAGE_INSTANCES ],
  ]
};

const DEFAULT_STORAGE_INSTANCE_PROVIDER = {
  provide: Storage,
  useFactory: defaultStorageInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), PROVIDED_STORAGE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_STORAGE_INSTANCE_PROVIDER,
    STORAGE_INSTANCES_PROVIDER,
  ]
})
export class StorageModule {
}

export function provideStorage(fn: () => FirebaseStorage): ModuleWithProviders<StorageModule> {
  return {
    ngModule: StorageModule,
    providers: [{
      provide: PROVIDED_STORAGE_INSTANCES,
      useFactory: storageInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
