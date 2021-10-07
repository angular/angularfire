import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, APP_INITIALIZER, Injector } from '@angular/core';
import { isSupported, Messaging as FirebaseMessaging } from 'firebase/messaging';
import { ɵgetDefaultInstanceOf, ɵAngularFireSchedulers, VERSION } from '@angular/fire';
import { Messaging, MessagingInstances, MESSAGING_PROVIDER_NAME } from './messaging';
import { FirebaseApps, FirebaseApp } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';

const PROVIDED_MESSAGING_INSTANCES = new InjectionToken<Messaging[]>('angularfire2.messaging-instances');
export const IS_SUPPORTED = new InjectionToken<boolean>('angularfire2.messaging.isSupported');

export const isSupportedValueSymbol = '__angularfire_symbol__messagingIsSupportedValue';
export const isSupportedPromiseSymbol = '__angularfire_symbol__messagingIsSupported';

globalThis[isSupportedPromiseSymbol] ||= isSupported().then(it => globalThis[isSupportedValueSymbol] ??= it);

export function defaultMessagingInstanceFactory(isSupported: boolean, provided: FirebaseMessaging[]|undefined, defaultApp: FirebaseApp) {
  if (!isSupported) { return null; }
  const defaultMessaging = ɵgetDefaultInstanceOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME, provided, defaultApp);
  return defaultMessaging && new Messaging(defaultMessaging);
}

export function messagingInstanceFactory(fn: (injector: Injector) => FirebaseMessaging) {
  return (zone: NgZone, isSupported: boolean, injector: Injector) => {
    if (!isSupported) { return null; }
    const messaging = zone.runOutsideAngular(() => fn(injector));
    return new Messaging(messaging);
  };
}

const MESSAGING_INSTANCES_PROVIDER = {
  provide: MessagingInstances,
  deps: [
    [new Optional(), PROVIDED_MESSAGING_INSTANCES ],
  ]
};

const DEFAULT_MESSAGING_INSTANCE_PROVIDER = {
  provide: Messaging,
  useFactory: defaultMessagingInstanceFactory,
  deps: [
    IS_SUPPORTED,
    [new Optional(), PROVIDED_MESSAGING_INSTANCES ],
    FirebaseApp,
  ]
};

@NgModule({
  providers: [
    DEFAULT_MESSAGING_INSTANCE_PROVIDER,
    MESSAGING_INSTANCES_PROVIDER,
    {
      provide: APP_INITIALIZER,
      useValue: () => globalThis[isSupportedPromiseSymbol],
      multi: true,
    },
  ]
})
export class MessagingModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'fcm');
  }
}

export function provideMessaging(fn: () => FirebaseMessaging, ...deps: any[]): ModuleWithProviders<MessagingModule> {
  return {
    ngModule: MessagingModule,
    providers: [{
      provide: IS_SUPPORTED,
      // TODO throw if this hasn't been resolved yet
      useFactory: () => globalThis[isSupportedValueSymbol],
    }, {
      provide: PROVIDED_MESSAGING_INSTANCES,
      useFactory: messagingInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        IS_SUPPORTED,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ],
    }]
  };
}
