import { NgModule, Optional, NgZone, InjectionToken } from '@angular/core';
import { FirebaseMessaging } from 'firebase/messaging';

import { ɵsmartCacheInstance, ɵfetchCachedInstance } from '../core';
import { Messaging } from './messaging';
import { DEFAULT_APP_NAME, FIREBASE_APPS } from '../app/app.module';
import { ɵAngularFireSchedulers } from '../zones';

export const MESSAGING_INSTANCES = new InjectionToken<Messaging[]>('angularfire2.messaging-instances');

const CACHE_PREFIX = 'Messaging';

export function ɵdefaultMessagingInstanceFactory(_: Messaging[]) {
  const messaging = ɵfetchCachedInstance([CACHE_PREFIX, DEFAULT_APP_NAME].join('.'));
  if (messaging) {
    return new Messaging(messaging);
  }
  throw new Error(`No FirebaseMessaging Instance provided for the '${DEFAULT_APP_NAME}' Firebase App - call provideMessaging(...) in your providers list.`);
}

export function ɵwrapMessagingInstanceInInjectable(messaging: FirebaseMessaging) {
  return new Messaging(messaging);
}

export function ɵmessagingInstancesFactory(instances: Messaging[]) {
  return instances;
}

// Hack: useFactory doesn't allow us to pass a lambda, so let's bind the arugments
// Going this direction to cut down on DI token noise; also making it easier to support
// multiple Firebase Apps
export function ɵboundMessagingInstanceFactory(zone: NgZone) {
  const messaging = ɵsmartCacheInstance<FirebaseMessaging>(CACHE_PREFIX, this, zone);
  return new Messaging(messaging);
}

const DEFAULT_MESSAGING_INSTANCE_PROVIDER = {
  provide: Messaging,
  useFactory: ɵdefaultMessagingInstanceFactory,
  deps: [
    NgZone,
    [new Optional(), MESSAGING_INSTANCES ],
  ]
};

@NgModule({
  providers: [
    DEFAULT_MESSAGING_INSTANCE_PROVIDER,
  ]
})
export class MessagingModule {
}

export function provideMessaging(fn: () => FirebaseMessaging) {
  return {
    ngModule: MessagingModule,
    providers: [{
      provide: MESSAGING_INSTANCES,
      useFactory: ɵboundMessagingInstanceFactory.bind(fn),
      multi: true,
      deps: [
        NgZone,
        ɵAngularFireSchedulers,
        [new Optional(), FIREBASE_APPS ]
      ]
    }]
  };
}
