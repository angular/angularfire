import { NgModule, Optional } from '@angular/core';
import { NgZone, InjectionToken } from '@angular/core';
import { ɵfetchInstance, DEFAULT_APP_NAME, FIREBASE_APPS, FirebaseApp } from '@angular/fire';
import { initializeAuth, Dependencies, AuthSettings, Persistence, useAuthEmulator, setPersistence } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { AngularFireAuth } from './auth';

export const AUTH_INSTANCES = new InjectionToken<AngularFireAuth[]>('angularfire2.auth-instances');

type UseEmulatorArguments = Parameters<typeof useAuthEmulator> extends [infer _, ...infer Args] ? Args : never;

export type FactoryOptions = {
  appName?: string,
  dependencies?: Dependencies,
  useEmulator?: UseEmulatorArguments,
  tenantId?: string,
  useDeviceLanguage?: boolean,
  languageCode?: string,
  settings?: AuthSettings,
  persistence?: Persistence,
};

export function instanceFactory(zone: NgZone, _: FirebaseApp[]) {
  const options: FactoryOptions = this || {};
  const auth = zone.runOutsideAngular(() => {
    const app = getApp(options.appName);
    return ɵfetchInstance(`${app.name}.auth`, 'AngularFireAuth', app.name, () => {
      const auth = initializeAuth(app, options.dependencies);
      if (options.useEmulator) {
        useAuthEmulator(auth, ...options.useEmulator);
      }
      if (options.tenantId) {
        auth.tenantId = options.tenantId;
      }
      // TODO(jamesdaniels): beta.1 languageCode is not settable
      // auth.languageCode = languageCode;
      if (options.useDeviceLanguage) {
        auth.useDeviceLanguage();
      }
      if (options.settings) {
        Object.values(options.settings).forEach(([k, v]) => {
          auth.settings[k] = v;
        });
      }
      if (options.persistence) {
        setPersistence(auth, options.persistence);
      }
      return auth;
    }, options);
  });
  return new AngularFireAuth(auth);
}

export function defaultInstanceFactory(zone: NgZone, instances: AngularFireAuth[]) {
  return instances?.find(it => it.name === DEFAULT_APP_NAME) || instanceFactory.bind({})(zone, []);
}

const DEFAULT_AUTH_INSTANCE_PROVIDER = {
  provide: AngularFireAuth,
  useFactory: defaultInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), AUTH_INSTANCES ]
  ]
};

@NgModule({
  providers: [ DEFAULT_AUTH_INSTANCE_PROVIDER ]
})
export class AngularFireAuthModule {
  static initializeAuth(options?: FactoryOptions) {
    return {
      ngModule: AngularFireAuthModule,
      providers: [{
        provide: AUTH_INSTANCES,
        useFactory: instanceFactory.bind(options),
        multi: true,
        deps: [
          NgZone,
          [new Optional(), FIREBASE_APPS ]
        ]
      }]
    };
  }
}
