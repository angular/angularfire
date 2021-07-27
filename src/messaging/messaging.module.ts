import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { FirebaseMessaging } from 'firebase/messaging';
import { ɵgetDefaultInstanceOf, ɵmemoizeInstance, ɵAngularFireSchedulers } from '@angular/fire';
import { Messaging, MessagingInstances, MESSAGING_PROVIDER_NAME } from './messaging';
import { FirebaseApps } from '@angular/fire/app';

export const PROVIDED_MESSAGING_INSTANCES = new InjectionToken<Messaging[]>('angularfire2.messaging-instances');

export function defaultMessagingInstanceFactory(_: Messaging[]) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME);
  return new Messaging(defaultAuth);
}

export function messagingInstanceFactory(fn: () => FirebaseMessaging) {
  return (zone: NgZone) => {
    const messaging = ɵmemoizeInstance<FirebaseMessaging>(fn, zone);
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
    NgZone,
    [new Optional(), PROVIDED_MESSAGING_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_MESSAGING_INSTANCE_PROVIDER,
    MESSAGING_INSTANCES_PROVIDER,
  ]
})
export class MessagingModule {
}

export function provideMessaging(fn: () => FirebaseMessaging): ModuleWithProviders<MessagingModule> {
  return {
    ngModule: MessagingModule,
    providers: [{
      provide: PROVIDED_MESSAGING_INSTANCES,
      useFactory: messagingInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        FirebaseApps,
      ]
    }]
  };
}
