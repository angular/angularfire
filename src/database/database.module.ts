import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { FirebaseDatabase } from 'firebase/database';

import { PROVIDED_AUTH_INSTANCES } from '../auth/auth.module';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance } from '../core';
import { Database, DatabaseInstances, DATABASE_PROVIDER_NAME } from './database';
import { PROVIDED_FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const PROVIDED_DATABASE_INSTANCES = new InjectionToken<Database[]>('angularfire2.database-instances');

export function ɵdefaultDatabaseInstanceFactory(_: Database[]) {
  const defaultDatabase = ɵgetDefaultInstanceOf<FirebaseDatabase>(DATABASE_PROVIDER_NAME);
  return new Database(defaultDatabase);
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundDatabaseInstanceFactory(zone: NgZone) {
  const database = ɵmemoizeInstance<FirebaseDatabase>(this, zone);
  return new Database(database);
}

const DATABASE_INSTANCES_PROVIDER = {
  provide: DatabaseInstances,
  deps: [
    [new Optional(), PROVIDED_DATABASE_INSTANCES ],
  ]
};

const DEFAULT_DATABASE_INSTANCE_PROVIDER = {
  provide: Database,
  useFactory: ɵdefaultDatabaseInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), PROVIDED_DATABASE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_DATABASE_INSTANCE_PROVIDER,
    DATABASE_INSTANCES_PROVIDER,
  ]
})
export class FirebaseDatabaseModule {
}

export function provideDatabase(fn: () => FirebaseDatabase): ModuleWithProviders<FirebaseDatabaseModule> {
  return {
    ngModule: FirebaseDatabaseModule,
    providers: [{
      provide: PROVIDED_DATABASE_INSTANCES,
      useFactory: ɵboundDatabaseInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), PROVIDED_FIREBASE_APPS ],
        // Database+Auth work better if Auth is loaded first
        [new Optional(), PROVIDED_AUTH_INSTANCES ],
      ]
    }]
  };
}
