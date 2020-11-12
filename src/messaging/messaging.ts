import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import firebase from 'firebase/app';
import { concat, EMPTY, Observable, of, throwError, fromEvent } from 'rxjs';
import { catchError, defaultIfEmpty, map, mergeMap, observeOn, switchMap, switchMapTo, shareReplay, filter, subscribeOn } from 'rxjs/operators';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵlazySDKProxy,
  ɵPromiseProxy,
  ɵapplyMixins
} from '@angular/fire';
import { isPlatformServer } from '@angular/common';
import { proxyPolyfillCompat } from './base';

export const VAPID_KEY = new InjectionToken<string>('angularfire2.messaging.vapid-key');
export const SERVICE_WORKER = new InjectionToken<Promise<ServiceWorkerRegistration>>('angularfire2.messaging.service-worker-registeration');

// SEMVER(7): drop
const firebaseLTv8 = parseInt(firebase.SDK_VERSION, 10) < 8;

export interface AngularFireMessaging extends Omit<ɵPromiseProxy<firebase.messaging.Messaging>, 'deleteToken' | 'getToken' | 'requestPermission'> {
}

@Injectable({
  providedIn: 'any'
})
export class AngularFireMessaging {

  public readonly requestPermission: Observable<void>;
  public readonly getToken: Observable<string | null>;
  public readonly tokenChanges: Observable<string | null>;
  public readonly messages: Observable<{}>;
  public readonly requestToken: Observable<string | null>;
  public readonly deleteToken: (token: string) => Observable<boolean>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string | FirebaseAppConfig | null | undefined,
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
      switchMap(() => isPlatformServer(platformId) ? EMPTY : import('firebase/messaging')),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      switchMap(async app => {
        const messaging = app.messaging();
        if (firebaseLTv8) {
          if (vapidKey) {
            messaging.usePublicVapidKey(vapidKey);
          }
          if (serviceWorker) {
            messaging.useServiceWorker(await serviceWorker);
          }
        }
        return messaging;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.requestPermission = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      // tslint:disable-next-line
      switchMap(messaging => firebase.messaging.isSupported() ? messaging.requestPermission() : throwError('Not supported.'))
    );

    this.getToken = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(async messaging => {
        if (firebase.messaging.isSupported() && Notification.permission === 'granted') {
          if (firebaseLTv8) {
            return await messaging.getToken();
          } else {
            const serviceWorkerRegistration = serviceWorker ? await serviceWorker : null;
            return await messaging.getToken({ vapidKey, serviceWorkerRegistration });
          }
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
      switchMap(() => firebase.messaging.isSupported() ? concat(this.getToken, tokenChange$) : EMPTY)
    );


    this.messages = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(messaging => firebase.messaging.isSupported() ? new Observable<string>(emitter =>
        messaging.onMessage(next => emitter.next(next), err => emitter.error(err), () => emitter.complete())
      ) : EMPTY),
    );

    this.requestToken = of(undefined).pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(() => this.requestPermission),
      catchError(() => of(null)),
      mergeMap(() => this.tokenChanges)
    );

    // SEMVER(7): drop token
    this.deleteToken = (token?: string) => messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(messaging => messaging.deleteToken(token || undefined)),
      defaultIfEmpty(false)
    );

    return ɵlazySDKProxy(this, messaging, zone);
  }

}

ɵapplyMixins(AngularFireMessaging, [proxyPolyfillCompat]);
