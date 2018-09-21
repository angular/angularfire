import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { messaging } from 'firebase';
import { Observable, empty, from, of, throwError } from 'rxjs';
import { mergeMap, catchError, map, switchMap, concat, defaultIfEmpty } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig, runOutsideAngular } from '@angular/fire';
import { FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory, FirebaseZoneScheduler } from '@angular/fire';

@Injectable()
export class AngularFireMessaging {
  messaging: Observable<messaging.Messaging>;
  requestPermission: Observable<void>;
  getToken: Observable<string|null>;
  tokenChanges: Observable<string|null>;
  messages: Observable<{}>;
  requestToken: Observable<string|null>;
  deleteToken: (token: string) => Observable<boolean>;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {

    if (isPlatformBrowser(platformId)) {

      // @ts-ignore
      const requireMessaging = from(import('firebase/messaging'));

      this.messaging = requireMessaging.pipe(
        map(() => _firebaseAppFactory(options, nameOrConfig)),
        map(app => app.messaging()),
        runOutsideAngular(zone)
      );

      this.requestPermission = this.messaging.pipe(
        switchMap(messaging => messaging.requestPermission()),
        runOutsideAngular(zone)
      );

    } else {

      this.messaging = empty();
      this.requestPermission = throwError('Not available on server platform.');

    }

    this.getToken = this.messaging.pipe(
      switchMap(messaging => messaging.getToken()),
      defaultIfEmpty(null),
      runOutsideAngular(zone)
    );

    const tokenChanges = this.messaging.pipe(
      switchMap(messaging => new Observable(messaging.onTokenRefresh)),
      runOutsideAngular(zone)
    );

    this.tokenChanges = this.getToken.pipe(
      concat(tokenChanges)
    );

    this.messages = this.messaging.pipe(
      switchMap(messaging => new Observable(messaging.onMessage)),
      runOutsideAngular(zone)
    );

    this.requestToken = this.requestPermission.pipe(
      catchError(() => of(null)),
      mergeMap(() => this.tokenChanges)
    );

    this.deleteToken = (token: string) => this.messaging.pipe(
      switchMap(messaging => messaging.deleteToken(token)),
      defaultIfEmpty(false),
      runOutsideAngular(zone)
    );
  }

}
