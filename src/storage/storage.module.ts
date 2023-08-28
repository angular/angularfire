import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, Injector } from '@angular/core';
import { FirebaseStorage } from 'firebase/storage';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Storage, StorageInstances, STORAGE_PROVIDER_NAME } from './storage';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { AuthInstances } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { ɵAppCheckInstances } from '@angular/fire';

export const PROVIDED_STORAGE_INSTANCES = new InjectionToken<Storage[]>('angularfire2.storage-instances');

export function defaultStorageInstanceFactory(provided: FirebaseStorage[]|undefined, defaultApp: FirebaseApp) {
  const defaultStorage = ɵgetDefaultInstanceOf<FirebaseStorage>(STORAGE_PROVIDER_NAME, provided, defaultApp);
  return defaultStorage && new Storage(defaultStorage);
}

export function storageInstanceFactory(fn: (injector: Injector) => FirebaseStorage) {
  return (zone: NgZone, injector: Injector) => {
    const storage = zone.runOutsideAngular(() => fn(injector));
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

export function provideStorage(fn: (injector: Injector) => FirebaseStorage, ...deps: any[]): ModuleWithProviders<StorageModule> {
  return {
    ngModule: StorageModule,
    providers: [{
      provide: PROVIDED_STORAGE_INSTANCES,
      useFactory: storageInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        // Defensively load Auth first, if provided
        [new Optional(), AuthInstances ],
        [new Optional(), ɵAppCheckInstances ],
        ...deps,
      ]
    }]
  };
}
