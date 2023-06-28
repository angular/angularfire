import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, Injector } from '@angular/core';
import { Auth as FirebaseAuth } from 'firebase/auth';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Auth, AuthInstances, AUTH_PROVIDER_NAME } from './auth';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { ɵAppCheckInstances } from '@angular/fire';

export const PROVIDED_AUTH_INSTANCES = new InjectionToken<Auth[]>('angularfire2.auth-instances');

export function defaultAuthInstanceFactory(provided: FirebaseAuth[]|undefined, defaultApp: FirebaseApp) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseAuth>(AUTH_PROVIDER_NAME, provided, defaultApp);
  return defaultAuth && new Auth(defaultAuth);
}

export function authInstanceFactory(fn: (injector: Injector) => FirebaseAuth) {
  return (zone: NgZone, injector: Injector) => {
    const auth = zone.runOutsideAngular(() => fn(injector));
    return new Auth(auth);
  };
}

const AUTH_INSTANCES_PROVIDER = {
  provide: AuthInstances,
  deps: [
    [new Optional(), PROVIDED_AUTH_INSTANCES ],
  ]
};

const DEFAULT_AUTH_INSTANCE_PROVIDER = {
  provide: Auth,
  useFactory: defaultAuthInstanceFactory,
  deps: [
    [new Optional(), PROVIDED_AUTH_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_AUTH_INSTANCE_PROVIDER,
    AUTH_INSTANCES_PROVIDER,
  ]
})
export class AuthModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'auth');
  }
}

export function provideAuth(fn: (injector: Injector) => FirebaseAuth, ...deps: any[]): ModuleWithProviders<AuthModule> {
  return {
    ngModule: AuthModule,
    providers: [{
      provide: PROVIDED_AUTH_INSTANCES,
      useFactory: authInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        [new Optional(), ɵAppCheckInstances ],
        ...deps,
      ]
    }]
  };
}
