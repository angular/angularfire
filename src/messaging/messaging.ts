import { Inject, Injectable, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { messaging } from 'firebase/app';
import { concat, EMPTY, Observable, of, throwError } from 'rxjs';
import { catchError, defaultIfEmpty, map, mergeMap, observeOn, switchMap } from 'rxjs/operators';
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
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.messaging())
    );

    if (!isPlatformServer(platformId)) {

      this.requestPermission = messaging.pipe(
        observeOn(schedulers.outsideAngular),
        switchMap(messaging => messaging.requestPermission())
      );

    } else {

      this.requestPermission = throwError('Not available on server platform.');

    }

    this.getToken = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => messaging.getToken()),
      defaultIfEmpty(null)
    );

    const tokenChanges = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => new Observable(messaging.onTokenRefresh.bind(messaging)).pipe(
        switchMap(() => messaging.getToken())
      ))
    );

    this.tokenChanges = concat(
      messaging.pipe(
        observeOn(schedulers.outsideAngular),
        switchMap(messaging => messaging.getToken())
      ),
      tokenChanges
    );

    this.messages = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => new Observable(messaging.onMessage.bind(messaging)))
    );

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
