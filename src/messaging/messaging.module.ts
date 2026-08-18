import { isPlatformServer } from '@angular/common';
import {
  EnvironmentProviders,
  InjectionToken,
  Injector,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  makeEnvironmentProviders,
} from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { Messaging as FirebaseMessaging } from 'firebase/messaging';
import { MESSAGING_PROVIDER_NAME, Messaging, MessagingInstances } from './messaging';

const PROVIDED_MESSAGING_INSTANCES = new InjectionToken<Messaging[]>('angularfire2.messaging-instances');

export function defaultMessagingInstanceFactory(provided: FirebaseMessaging[]|undefined, defaultApp: FirebaseApp, platformId: object) {
  if (isPlatformServer(platformId)) { return null; }
  const defaultMessaging = ɵgetDefaultInstanceOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME, provided, defaultApp);
  return defaultMessaging && new Messaging(defaultMessaging);
}

export function messagingInstanceFactory(fn: (injector: Injector) => FirebaseMessaging) {
  return (zone: NgZone, injector: Injector, platformId: object) => {
    if (isPlatformServer(platformId)) { return null; }
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
    [new Optional(), PROVIDED_MESSAGING_INSTANCES ],
    FirebaseApp,
    PLATFORM_ID,
  ]
};

@NgModule({
  providers: [
    DEFAULT_MESSAGING_INSTANCE_PROVIDER,
    MESSAGING_INSTANCES_PROVIDER,
  ]
})
export class MessagingModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'fcm');
  }
}

export function provideMessaging(fn: (injector: Injector) => FirebaseMessaging, ...deps: any[]): EnvironmentProviders {
  registerVersion('angularfire', VERSION.full, 'fcm');

  return makeEnvironmentProviders([
    DEFAULT_MESSAGING_INSTANCE_PROVIDER,
    MESSAGING_INSTANCES_PROVIDER,
    {
      provide: PROVIDED_MESSAGING_INSTANCES,
      useFactory: messagingInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        PLATFORM_ID,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ],
    }
  ]);
}
