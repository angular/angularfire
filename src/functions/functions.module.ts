import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { Functions as FirebaseFunctions, getFunctions } from 'firebase/functions';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers } from '@angular/fire';
import { Functions, FunctionsInstances, FUNCTIONS_PROVIDER_NAME } from './functions';
import { getApp } from 'firebase/app';
import { FirebaseApps } from '@angular/fire/app';

export const PROVIDED_FUNCTIONS_INSTANCES = new InjectionToken<Functions[]>('angularfire2.functions-instances');

export function defaultFunctionsInstanceFactory(_: Functions[]) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseFunctions>(FUNCTIONS_PROVIDER_NAME) || getFunctions(getApp());
  return new Functions(defaultAuth);
}

export function functionsInstanceFactory(fn: () => FirebaseFunctions) {
  return (zone: NgZone) => {
    const functions = ɵmemoizeInstance<FirebaseFunctions>(fn, zone);
    return new Functions(functions);
  };
}

const FUNCTIONS_INSTANCES_PROVIDER = {
  provide: FunctionsInstances,
  deps: [
    [new Optional(), PROVIDED_FUNCTIONS_INSTANCES ],
  ]
};

const DEFAULT_FUNCTIONS_INSTANCE_PROVIDER = {
  provide: Functions,
  useFactory: defaultFunctionsInstanceFactory,
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
      useFactory: functionsInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
