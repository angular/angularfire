import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, Injector } from '@angular/core';
import { Database as FirebaseDatabase } from 'firebase/database';
import { AuthInstances } from '@angular/fire/auth';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Database, DatabaseInstances, DATABASE_PROVIDER_NAME } from './database';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { AppCheckInstances } from '@angular/fire';

export const PROVIDED_DATABASE_INSTANCES = new InjectionToken<Database[]>('angularfire2.database-instances');

export function defaultDatabaseInstanceFactory(provided: FirebaseDatabase[]|undefined, defaultApp: FirebaseApp) {
  const defaultDatabase = ɵgetDefaultInstanceOf<FirebaseDatabase>(DATABASE_PROVIDER_NAME, provided, defaultApp);
  return defaultDatabase && new Database(defaultDatabase);
}

export function databaseInstanceFactory(fn: (injector: Injector) => FirebaseDatabase) {
  return (zone: NgZone, injector: Injector) => {
    const database = zone.runOutsideAngular(() => fn(injector));
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

export function provideDatabase(fn: (injector: Injector) => FirebaseDatabase, ...deps: any[]): ModuleWithProviders<DatabaseModule> {
  return {
    ngModule: DatabaseModule,
    providers: [{
      provide: PROVIDED_DATABASE_INSTANCES,
      useFactory: databaseInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        // Database+Auth work better if Auth is loaded first
        [new Optional(), AuthInstances ],
        [new Optional(), AppCheckInstances ],
        ...deps,
      ]
    }]
  };
}
