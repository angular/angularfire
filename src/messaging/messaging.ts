import { Inject, Injectable, NgZone, Optional, PLATFORM_ID } from '@angular/core';
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
    zone: NgZone
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);

    const messaging = of(undefined).pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(() => isPlatformServer(platformId) ? EMPTY : import('firebase/messaging')),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.messaging()),
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
      switchMap(messaging => firebase.messaging.isSupported() && Notification.permission === 'granted' ? messaging.getToken() : EMPTY),
      defaultIfEmpty(null)
    );

    const tokenChanges = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(messaging => firebase.messaging.isSupported() ? new Observable<string>(emitter =>
        messaging.onTokenRefresh(emitter.next, emitter.error, emitter.complete)
      ) : EMPTY),
      switchMapTo(this.getToken)
    );

    this.tokenChanges = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(messaging => firebase.messaging.isSupported() ? concat(this.getToken, tokenChanges) : EMPTY)
    );


    this.messages = messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(messaging => firebase.messaging.isSupported() ? new Observable<string>(emitter =>
        messaging.onMessage(next => emitter.next(next), err => emitter.error(err), () => emitter.complete())
      ) : EMPTY),
    );

    this.requestToken = of(undefined).pipe(
      switchMap(() => this.requestPermission),
      catchError(() => of(null)),
      mergeMap(() => this.tokenChanges)
    );

    this.deleteToken = (token: string) => messaging.pipe(
      subscribeOn(schedulers.outsideAngular),
      observeOn(schedulers.insideAngular),
      switchMap(messaging => messaging.deleteToken(token)),
      defaultIfEmpty(false)
    );

    return ɵlazySDKProxy(this, messaging, zone);
  }

}

ɵapplyMixins(AngularFireMessaging, [proxyPolyfillCompat]);
