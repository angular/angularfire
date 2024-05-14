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
import { ɵAppCheckInstances } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { Auth as FirebaseAuth } from 'firebase/auth';
import { AUTH_PROVIDER_NAME, Auth, AuthInstances } from './auth';

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

export function provideAuth(fn: (injector: Injector) => FirebaseAuth, ...deps: any[]): EnvironmentProviders {
  registerVersion('angularfire', VERSION.full, 'auth');
  return makeEnvironmentProviders([
    DEFAULT_AUTH_INSTANCE_PROVIDER,
    AUTH_INSTANCES_PROVIDER,
    {
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
    }
  ]);
}
