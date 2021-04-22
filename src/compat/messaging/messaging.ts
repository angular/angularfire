import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import firebase from 'firebase/compat/app';
import { concat, EMPTY, Observable, of, throwError, fromEvent } from 'rxjs';
import { catchError, defaultIfEmpty, map, mergeMap, observeOn, switchMap, switchMapTo, shareReplay, filter, subscribeOn } from 'rxjs/operators';
import {
  ɵAngularFireSchedulers,
  ɵlazySDKProxy,
  ɵPromiseProxy,
  ɵfetchInstance,
  ɵapplyMixins
} from '@angular/fire';
import { ɵfirebaseAppFactory, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { FirebaseOptions } from 'firebase/app';
import { isPlatformServer } from '@angular/common';
import { proxyPolyfillCompat } from './base';

export const VAPID_KEY = new InjectionToken<string>('angularfire2.messaging.vapid-key');
export const SERVICE_WORKER = new InjectionToken<Promise<ServiceWorkerRegistration>>('angularfire2.messaging.service-worker-registeration');

export interface AngularFireMessaging extends Omit<ɵPromiseProxy<firebase.messaging.Messaging>, 'deleteToken' | 'getToken' | 'requestPermission'> {
}

@Injectable({
  providedIn: 'any'
})
export class AngularFireMessaging {

  public readonly requestPermission: Observable<NotificationPermission>;
  public readonly getToken: Observable<string | null>;
  public readonly tokenChanges: Observable<string | null>;
  public readonly messages: Observable<firebase.messaging.MessagePayload>;
  public readonly requestToken: Observable<string | null>;
  public readonly deleteToken: (token: string) => Observable<boolean>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | null | undefined,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(VAPID_KEY) vapidKey: string|null,
    @Optional() @Inject(SERVICE_WORKER) _serviceWorker: any,
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);
    const serviceWorker: Promise<ServiceWorkerRegistration> | null = _serviceWorker;

    const messaging = of(undefined).pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(() => isPlatformServer(platformId) ? EMPTY : import('firebase/compat/messaging')),
      map(() => ɵfirebaseAppFactory(options, zone, name)),
      switchMap(app => ɵfetchInstance(`${app.name}.messaging`, 'AngularFireMessaging', app.name, async () => {
        return app.messaging();
      }, [])),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    const isSupported = () => !isPlatformServer(platformId); // firebase.messaging.isSupported(); feedback filed

    this.requestPermission = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      // tslint:disable-next-line
      switchMap(() => isSupported() ? Notification.requestPermission() : throwError('Not supported.'))
    );

    this.getToken = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(async messaging => {
        if (isSupported() && Notification.permission === 'granted') {
          const serviceWorkerRegistration = serviceWorker ? await serviceWorker : null;
          return await messaging.getToken({ vapidKey, serviceWorkerRegistration });
        } else {
          return null;
        }
      })
    );

    const notificationPermission$ = new Observable<string>(emitter => {
      navigator.permissions.query({ name: 'notifications' }).then(notificationPerm => {
        notificationPerm.onchange = () => emitter.next();
      });
    });


    const tokenChange$ = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMapTo(notificationPermission$),
      switchMapTo(this.getToken)
    );

    this.tokenChanges = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(() => isSupported() ? concat(this.getToken, tokenChange$) : EMPTY)
    );


    this.messages = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(messaging => isSupported() ? new Observable<firebase.messaging.MessagePayload>(emitter =>
        messaging.onMessage(emitter)
      ) : EMPTY),
    );

    this.requestToken = of(undefined).pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(() => this.requestPermission),
      catchError(() => of(null)),
      mergeMap(() => this.tokenChanges)
    );

    this.deleteToken = () => messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(messaging => messaging.deleteToken()),
      defaultIfEmpty(false)
    );

    return ɵlazySDKProxy(this, messaging, zone);
  }

}

ɵapplyMixins(AngularFireMessaging, [proxyPolyfillCompat]);
