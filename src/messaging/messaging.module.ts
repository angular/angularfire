import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders, APP_INITIALIZER } from '@angular/core';
import { isSupported, Messaging as FirebaseMessaging } from 'firebase/messaging';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers } from '@angular/fire';
import { Messaging, MessagingInstances, MESSAGING_PROVIDER_NAME } from './messaging';
import { FirebaseApps } from '@angular/fire/app';

const PROVIDED_MESSAGING_INSTANCES = new InjectionToken<Messaging[]>('angularfire2.messaging-instances');
const IS_SUPPORTED = new InjectionToken<boolean>('angularfire2.messaging.isSupported');

const isSupportedSymbol = Symbol('angularfire2.messaging.isSupported');

export function defaultMessagingInstanceFactory(isSupported: boolean) {
  const defaultAuth = isSupported ? ɵgetDefaultInstanceOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME) : undefined;
  return new Messaging(defaultAuth);
}

export function messagingInstanceFactory(fn: () => FirebaseMessaging) {
  return (zone: NgZone, isSupported: boolean) => {
    const messaging = isSupported ? ɵmemoizeInstance<FirebaseMessaging>(fn, zone) : undefined;
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
    NgZone,
    [new Optional(), PROVIDED_MESSAGING_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_MESSAGING_INSTANCE_PROVIDER,
    MESSAGING_INSTANCES_PROVIDER,
    {
      provide: APP_INITIALIZER,
      useValue: () => isSupported().then(it => globalThis[isSupportedSymbol] = it),
      multi: true,
    },
  ]
})
export class MessagingModule {
}

export function provideMessaging(fn: () => FirebaseMessaging): ModuleWithProviders<MessagingModule> {
  return {
    ngModule: MessagingModule,
    providers: [{
      provide: IS_SUPPORTED,
      useFactory: () => globalThis[isSupportedSymbol],
    }, {
      provide: PROVIDED_MESSAGING_INSTANCES,
      useFactory: messagingInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        IS_SUPPORTED,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ],
    }]
  };
}
