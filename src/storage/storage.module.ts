import { InjectionToken, Injector, ModuleWithProviders, NgModule, NgZone, Optional } from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { ɵAppCheckInstances } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { AuthInstances } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { FirebaseStorage } from 'firebase/storage';
import { STORAGE_PROVIDER_NAME, Storage, StorageInstances } from './storage';

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
