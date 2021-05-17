import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { Functions as FirebaseFunctions } from 'firebase/functions';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { Functions } from './functions';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const FUNCTIONS_INSTANCES = new InjectionToken<Functions[]>('angularfire2.functions-instances');

const CACHE_PREFIX = 'Functions';

export function ɵdefaultFunctionsInstanceFactory(_: Functions[]) {
  const functions = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (functions) {
    return new Functions(functions);
  }
  throw new Error(`No Functions Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call provideFunctions(...) in your providers list.`);
}

export function ɵwrapFunctionsInstanceInInjectable(functions: FirebaseFunctions) {
  return new Functions(functions);
}

export function ɵfunctionsInstancesFactory(instances: Functions[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundFunctionsInstanceFactory(zone: NgZone) {
  const functions = ɵsmartCacheInstance<FirebaseFunctions>(CACHE_PREFIX, this, zone);
  return new Functions(functions);
}

const DEFAULT_FUNCTIONS_INSTANCE_PROVIDER = {
  provide: Functions,
  useFactory: ɵdefaultFunctionsInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), FUNCTIONS_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_FUNCTIONS_INSTANCE_PROVIDER,
  ]
})
export class FunctionsModule {
}

export function provideFunctions(fn: () => FirebaseFunctions) {
  return {
    ngModule: FunctionsModule,
    providers: [{
      provide: FUNCTIONS_INSTANCES,
      useFactory: ɵboundFunctionsInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), FIREBASE_APPS ]
      ]
    }]
  };
}
