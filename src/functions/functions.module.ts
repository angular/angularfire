import { InjectionToken, Injector, ModuleWithProviders, NgModule, NgZone, Optional } from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { ɵAppCheckInstances } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { AuthInstances } from '@angular/fire/auth';
import { registerVersion } from 'firebase/app';
import { Functions as FirebaseFunctions } from 'firebase/functions';
import { FUNCTIONS_PROVIDER_NAME, Functions, FunctionsInstances } from './functions';

export const PROVIDED_FUNCTIONS_INSTANCES = new InjectionToken<Functions[]>('angularfire2.functions-instances');

export function defaultFunctionsInstanceFactory(provided: FirebaseFunctions[]|undefined, defaultApp: FirebaseApp) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseFunctions>(FUNCTIONS_PROVIDER_NAME, provided, defaultApp);
  return defaultAuth && new Functions(defaultAuth);
}

export function functionsInstanceFactory(fn: (injector: Injector) => FirebaseFunctions) {
  return (zone: NgZone, injector: Injector) => {
    const functions = zone.runOutsideAngular(() => fn(injector));
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
    [new Optional(), PROVIDED_FUNCTIONS_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_FUNCTIONS_INSTANCE_PROVIDER,
    FUNCTIONS_INSTANCES_PROVIDER,
  ]
})
export class FunctionsModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'fn');
  }
}

export function provideFunctions(fn: (injector: Injector) => FirebaseFunctions, ...deps: any[]): ModuleWithProviders<FunctionsModule> {
  return {
    ngModule: FunctionsModule,
    providers: [{
      provide: PROVIDED_FUNCTIONS_INSTANCES,
      useFactory: functionsInstanceFactory(fn),
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
