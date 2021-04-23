import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { FirebaseDatabase } from 'firebase/database';
import { AUTH_INSTANCES } from '../auth/auth.module';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { Database } from './database';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';

export const DATABASE_INSTANCES = new InjectionToken<Database[]>('angularfire2.database-instances');

const CACHE_PREFIX = 'FirebaseDatabase';

export function ɵdefaultDatabaseInstanceFactory(_: Database[]) {
  const database = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (database) {
    return new Database(database);
  }
  throw new Error(`No FirebaseDatabase Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call provideDatabase(...) in your providers list.`);
}

export function ɵwrapDatabaseInstanceInInjectable(database: FirebaseDatabase) {
  return new Database(database);
}

export function ɵdatabaseInstancesFactory(instances: Database[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundDatabaseInstanceFactory(zone: NgZone) {
  const database = ɵsmartCacheInstance<FirebaseDatabase>(CACHE_PREFIX, this);
  return new Database(database);
}

const DEFAULT_DATABASE_INSTANCE_PROVIDER = {
  provide: Database,
  useFactory: ɵdefaultDatabaseInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), DATABASE_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_DATABASE_INSTANCE_PROVIDER,
  ]
})
export class FirebaseDatabaseModule {
}

export function provideDatabase(fn: () => FirebaseDatabase) {
  return {
    ngModule: FirebaseDatabaseModule,
    providers: [{
      provide: DATABASE_INSTANCES,
      useFactory: ɵboundDatabaseInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        [new Optional(), FIREBASE_APPS ],
        // Database+Auth work better if Auth is loaded first
        [new Optional(), AUTH_INSTANCES ],
      ]
    }]
  };
}
