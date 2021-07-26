import { NgModule, Optional, NgZone, InjectionToken, ModuleWithProviders } from '@angular/core';
import { FirebaseMessaging } from 'firebase/messaging';

import { ɵgetDefaultInstanceOf, ɵmemoizeInstance } from '../core';
import { Messaging, MessagingInstances, MESSAGING_PROVIDER_NAME } from './messaging';
import { PROVIDED_FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const PROVIDED_MESSAGING_INSTANCES = new InjectionToken<Messaging[]>('angularfire2.messaging-instances');

export function ɵdefaultMessagingInstanceFactory(_: Messaging[]) {
  const defaultAuth = ɵgetDefaultInstanceOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME);
  return new Messaging(defaultAuth);
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundMessagingInstanceFactory(zone: NgZone) {
  const messaging = ɵmemoizeInstance<FirebaseMessaging>(this, zone);
  return new Messaging(messaging);
}


const MESSAGING_INSTANCES_PROVIDER = {
  provide: MessagingInstances,
  deps: [
    [new Optional(), PROVIDED_MESSAGING_INSTANCES ],
  ]
};

const DEFAULT_MESSAGING_INSTANCE_PROVIDER = {
  provide: Messaging,
  useFactory: ɵdefaultMessagingInstanceFactory,
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
      useFactory: ɵboundMessagingInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), PROVIDED_FIREBASE_APPS ]
      ]
    }]
  };
}
