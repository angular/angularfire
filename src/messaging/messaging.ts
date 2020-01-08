import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { messaging } from 'firebase/app';
import { Observable, empty, from, of, throwError } from 'rxjs';
import { mergeMap, catchError, map, switchMap, concat, defaultIfEmpty } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig, ɵrunOutsideAngular, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire';
import { ɵfirebaseAppFactory, ɵFirebaseZoneScheduler } from '@angular/fire';

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
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {

    // @ts-ignore zapping in the UMD in the build script
    const requireMessaging = from(import('firebase/messaging'));

    this.messaging = requireMessaging.pipe(
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.messaging()),
      ɵrunOutsideAngular(zone)
    );

    if (!isPlatformServer(platformId)) {

      this.requestPermission = this.messaging.pipe(
        switchMap(messaging => messaging.requestPermission()),
        ɵrunOutsideAngular(zone)
      );

    } else {

      this.requestPermission = throwError('Not available on server platform.');

    }

    this.getToken = this.messaging.pipe(
      switchMap(messaging => messaging.getToken()),
      defaultIfEmpty(null),
      ɵrunOutsideAngular(zone)
    );

    const tokenChanges = this.messaging.pipe(
      switchMap(messaging => new Observable(messaging.onTokenRefresh.bind(messaging)).pipe(
        switchMap(() => messaging.getToken())
      )),
      ɵrunOutsideAngular(zone)
    );

    this.tokenChanges = this.getToken.pipe(
      concat(tokenChanges)
    );

    this.messages = this.messaging.pipe(
      switchMap(messaging => new Observable(messaging.onMessage.bind(messaging))),
      ɵrunOutsideAngular(zone)
    );

    this.requestToken = this.requestPermission.pipe(
      catchError(() => of(null)),
      mergeMap(() => this.tokenChanges)
    );

    this.deleteToken = (token: string) => this.messaging.pipe(
      switchMap(messaging => messaging.deleteToken(token)),
      defaultIfEmpty(false),
      ɵrunOutsideAngular(zone)
    );
  }

}
