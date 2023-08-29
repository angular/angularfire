import { APP_INITIALIZER, InjectionToken, Injector, ModuleWithProviders, NgModule, NgZone, Optional } from '@angular/core';
import { VERSION, ɵAngularFireSchedulers, ɵgetDefaultInstanceOf } from '@angular/fire';
import { FirebaseApp, FirebaseApps } from '@angular/fire/app';
import { registerVersion } from 'firebase/app';
import { Messaging as FirebaseMessaging } from 'firebase/messaging';
import { isMessagingSupportedFactory } from './is-messaging-supported-factory';
import { MESSAGING_PROVIDER_NAME, Messaging, MessagingInstances } from './messaging';

const PROVIDED_MESSAGING_INSTANCES = new InjectionToken<Messaging[]>('angularfire2.messaging-instances');

export function defaultMessagingInstanceFactory(provided: FirebaseMessaging[]|undefined, defaultApp: FirebaseApp) {
  if (!isMessagingSupportedFactory.sync()) { return null; }
  const defaultMessaging = ɵgetDefaultInstanceOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME, provided, defaultApp);
  return defaultMessaging && new Messaging(defaultMessaging);
}

export function messagingInstanceFactory(fn: (injector: Injector) => FirebaseMessaging) {
  return (zone: NgZone, injector: Injector) => {
    if (!isMessagingSupportedFactory.sync()) { return null; }
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
  ]
};

@NgModule({
  providers: [
    DEFAULT_MESSAGING_INSTANCE_PROVIDER,
    MESSAGING_INSTANCES_PROVIDER,
    {
      provide: APP_INITIALIZER,
      useValue: isMessagingSupportedFactory.async,
      multi: true,
    },
  ]
})
export class MessagingModule {
  constructor() {
    registerVersion('angularfire', VERSION.full, 'fcm');
  }
}

export function provideMessaging(fn: (injector: Injector) => FirebaseMessaging, ...deps: any[]): ModuleWithProviders<MessagingModule> {
  return {
    ngModule: MessagingModule,
    providers: [{
      provide: PROVIDED_MESSAGING_INSTANCES,
      useFactory: messagingInstanceFactory(fn),
      multi: true,
      deps: [
        NgZone,
        Injector,
        ɵAngularFireSchedulers,
        FirebaseApps,
        ...deps,
      ],
    }]
  };
}
