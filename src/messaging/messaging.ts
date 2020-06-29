import { Inject, Injectable, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { messaging } from 'firebase/app';
import firebase from 'firebase/app';
import { concat, EMPTY, Observable, of, throwError, fromEvent } from 'rxjs';
import { catchError, defaultIfEmpty, map, mergeMap, observeOn, switchMap, switchMapTo, tap, shareReplay, filter } from 'rxjs/operators';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵlazySDKProxy,
  ɵPromiseProxy
} from '@angular/fire';
import { isPlatformServer } from '@angular/common';

export interface AngularFireMessaging extends Omit<ɵPromiseProxy<messaging.Messaging>, 'deleteToken' | 'getToken' | 'requestPermission'> {
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
      observeOn(schedulers.outsideAngular),
      switchMap(() => isPlatformServer(platformId) ? EMPTY : import('firebase/messaging')),
      tap((it: any) => it), // It seems I need to touch the import for it to do anything... race maybe?
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.messaging()),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.requestPermission = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      // tslint:disable-next-line
      switchMap(messaging => firebase.messaging.isSupported() ? messaging.requestPermission() : throwError('Not supported.'))
    );

    this.getToken = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => firebase.messaging.isSupported() && Notification.permission === 'granted' ? messaging.getToken() : EMPTY),
      defaultIfEmpty(null)
    );

    const tokenChanges = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => firebase.messaging.isSupported() ? new Observable<string>(emitter =>
        messaging.onTokenRefresh(emitter.next, emitter.error, emitter.complete)
      ) : EMPTY),
      switchMapTo(this.getToken)
    );

    this.tokenChanges = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => firebase.messaging.isSupported() ? concat(this.getToken, tokenChanges) : EMPTY)
    );

    // TODO 6.1 add observable for clicks
    if (isPlatformServer(platformId)) {

      this.messages = EMPTY;

    } else {

      this.messages = fromEvent(navigator.serviceWorker, 'message').pipe(
        map((event: MessageEvent) => event.data.firebaseMessaging),
        filter((message: any) => !!message && message.type === 'push-received'),
        map((message: any) => message.payload),
        filter((payload: any) => !!payload)
      );

    }

    this.requestToken = of(undefined).pipe(
      switchMap(() => this.requestPermission),
      catchError(() => of(null)),
      mergeMap(() => this.tokenChanges)
    );

    this.deleteToken = (token: string) => messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => messaging.deleteToken(token)),
      defaultIfEmpty(false)
    );

    return ɵlazySDKProxy(this, messaging, zone);
  }

}
