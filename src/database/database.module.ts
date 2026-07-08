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
import { AppCheckInstances } from '@angular/fire/app-check';
import { AuthInstances } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { Database as FirebaseDatabase } from 'firebase/database';
import { DATABASE_PROVIDER_NAME, Database, DatabaseInstances } from './database';

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

export function provideDatabase(fn: (injector: Injector) => FirebaseDatabase, ...deps: any[]): EnvironmentProviders {
  registerVersion('angularfire', VERSION.full, 'rtdb');
  return makeEnvironmentProviders([
    DEFAULT_DATABASE_INSTANCE_PROVIDER,
    DATABASE_INSTANCES_PROVIDER,
    {
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
    }
  ]);
}
