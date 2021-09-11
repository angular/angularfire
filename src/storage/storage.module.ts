import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { FirebaseStorage } from 'firebase/storage';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Storage, StorageInstances, STORAGE_PROVIDER_NAME } from './storage';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { AuthInstances } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { AppCheckInstances } from '@angular/fire/app-check';

export const PROVIDED_STORAGE_INSTANCES = new InjectionToken<Storage[]>('angularfire2.storage-instances');

export function defaultStorageInstanceFactory(provided: FirebaseStorage[]|undefined, defaultApp: FirebaseApp) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseStorage>(STORAGE_PROVIDER_NAME, provided, defaultApp);
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
    [new Optional(), PROVIDED_STORAGE_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_STORAGE_INSTANCE_PROVIDER,
    STORAGE_INSTANCES_PROVIDER,
  ]
})
export class StorageModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'gcs');
  }
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
        // Defensively load Auth first, if provided
        [new Optional(), AuthInstances ],
        [new Optional(), AppCheckInstances ],
      ]
    }]
  };
}
