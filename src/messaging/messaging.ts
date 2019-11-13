import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { messaging } from 'firebase/app';
import { Observable, from, of, throwError } from 'rxjs';
import { mergeMap, catchError, map, switchMap, concat, defaultIfEmpty, observeOn } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig, AngularFireSchedulers } from '@angular/fire';
import { FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory } from '@angular/fire';

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
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    const schedulers = new AngularFireSchedulers(zone);

    // @ts-ignore zapping in the UMD in the build script
    const requireMessaging = from(import('firebase/messaging'));

    this.messaging = requireMessaging.pipe(
      observeOn(schedulers.outsideAngular),
      map(() => _firebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.messaging()),
    );

    if (!isPlatformServer(platformId)) {

      this.requestPermission = this.messaging.pipe(
        observeOn(schedulers.outsideAngular),
        switchMap(messaging => messaging.requestPermission()),
      );

    } else {

      this.requestPermission = throwError('Not available on server platform.');

    }

    this.getToken = this.messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => messaging.getToken()),
      defaultIfEmpty(null),
    );

    const tokenChanges = this.messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => new Observable(messaging.onTokenRefresh.bind(messaging)).pipe(
        switchMap(() => messaging.getToken())
      )),
    );

    this.tokenChanges = this.getToken.pipe(
      concat(tokenChanges)
    );

    this.messages = this.messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => new Observable(messaging.onMessage.bind(messaging))),
    );

    this.requestToken = this.requestPermission.pipe(
      catchError(() => of(null)),
      mergeMap(() => this.tokenChanges)
    );

    this.deleteToken = (token: string) => this.messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => messaging.deleteToken(token)),
      defaultIfEmpty(false),
    );
  }

}
