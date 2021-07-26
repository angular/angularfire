import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { Functions as FirebaseFunctions } from 'firebase/functions';

import { ɵgetDefaultInstanceOf, ɵmemoizeInstance } from '../core';
import { Functions, FunctionsInstances, FUNCTIONS_PROVIDER_NAME } from './functions';
import { PROVIDED_FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const PROVIDED_FUNCTIONS_INSTANCES = new InjectionToken<Functions[]>('angularfire2.functions-instances');

export function ɵdefaultFunctionsInstanceFactory(_: Functions[]) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseFunctions>(FUNCTIONS_PROVIDER_NAME);
  return new Functions(defaultAuth);
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundFunctionsInstanceFactory(zone: NgZone) {
  const functions = ɵmemoizeInstance<FirebaseFunctions>(this, zone);
  return new Functions(functions);
}

const FUNCTIONS_INSTANCES_PROVIDER = {
  provide: FunctionsInstances,
  deps: [
    [new Optional(), PROVIDED_FUNCTIONS_INSTANCES ],
  ]
};

const DEFAULT_FUNCTIONS_INSTANCE_PROVIDER = {
  provide: Functions,
  useFactory: ɵdefaultFunctionsInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), PROVIDED_FUNCTIONS_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_FUNCTIONS_INSTANCE_PROVIDER,
    FUNCTIONS_INSTANCES_PROVIDER,
  ]
})
export class FunctionsModule {
}

export function provideFunctions(fn: () => FirebaseFunctions): ModuleWithProviders<FunctionsModule> {
  return {
    ngModule: FunctionsModule,
    providers: [{
      provide: PROVIDED_FUNCTIONS_INSTANCES,
      useFactory: ɵboundFunctionsInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), PROVIDED_FIREBASE_APPS ]
      ]
    }]
  };
}
