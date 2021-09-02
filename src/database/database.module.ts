import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { Database as FirebaseDatabase } from 'firebase/database';

import { AuthInstances } from '@angular/fire/auth';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Database, DatabaseInstances, DATABASE_PROVIDER_NAME } from './database';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';

export const PROVIDED_DATABASE_INSTANCES = new InjectionToken<Database[]>('angularfire2.database-instances');

export function defaultDatabaseInstanceFactory(provided: FirebaseDatabase[]|undefined, defaultApp: FirebaseApp) {
  const defaultDatabase = ɵgetDefaultInstanceOf<FirebaseDatabase>(DATABASE_PROVIDER_NAME, provided, defaultApp);
  return new Database(defaultDatabase);
}

export function databaseInstanceFactory(fn: () => FirebaseDatabase) {
  return (zone: NgZone) => {
    const database = ɵmemoizeInstance<FirebaseDatabase>(fn, zone);
    return new Database(database);
  };
}

const DATABASE_INSTANCES_PROVIDER = {
  provide: DatabaseInstances,
  deps: [
    [new Optional(), PROVIDED_DATABASE_INSTANCES ],
  ]
};

const DEFAULT_DATABASE_INSTANCE_PROVIDER = {
  provide: Database,
  useFactory: defaultDatabaseInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_DATABASE_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_DATABASE_INSTANCE_PROVIDER,
    DATABASE_INSTANCES_PROVIDER,
  ]
})
export class DatabaseModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'rtdb');
  }
}

export function provideDatabase(fn: () => FirebaseDatabase): ModuleWithProviders<DatabaseModule> {
  return {
    ngModule: DatabaseModule,
    providers: [{
      provide: PROVIDED_DATABASE_INSTANCES,
      useFactory: databaseInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        FirebaseApps,
        // Database+Auth work better if Auth is loaded first
        [new Optional(), AuthInstances ],
      ]
    }]
  };
}
