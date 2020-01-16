import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { messaging } from 'firebase/app';
import { Observable, empty, from, of, throwError } from 'rxjs';
import { mergeMap, catchError, map, switchMap, concat, shareReplay, defaultIfEmpty } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig, ɵrunOutsideAngular, FIREBASE_APP_NAME, FIREBASE_OPTIONS, ɵlazySDKProxy, ɵPromiseProxy } from '@angular/fire';
import { ɵfirebaseAppFactory } from '@angular/fire';
import { isPlatformServer } from '@angular/common';

export interface AngularFireMessaging extends Omit<ɵPromiseProxy<messaging.Messaging>, 'deleteToken'|'getToken'|'requestPermission'> {};

@Injectable({
  providedIn: 'root'
})
export class AngularFireMessaging {

  public readonly requestPermission: Observable<void>;
  public readonly getToken: Observable<string|null>;
  public readonly tokenChanges: Observable<string|null>;
  public readonly messages: Observable<{}>;
  public readonly requestToken: Observable<string|null>;
  public readonly deleteToken: (token: string) => Observable<boolean>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {

    const messaging = of(undefined).pipe(
      switchMap(() => from(import('firebase/messaging'))),
      // TODO is this needed?
      catchError(err => err.message === 'Not supported' ? empty() : throwError(err) ),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.messaging()),
      ɵrunOutsideAngular(zone),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    if (!isPlatformServer(platformId)) {
    
      this.requestPermission = messaging.pipe(
        switchMap(messaging => messaging.requestPermission()),
        ɵrunOutsideAngular(zone)
      );
    
    } else {
    
      this.requestPermission = throwError('Not available on server platform.');
    
    }

    this.getToken = messaging.pipe(
      switchMap(messaging => messaging.getToken()),
      defaultIfEmpty(null),
      ɵrunOutsideAngular(zone)
    )

    const tokenChanges = messaging.pipe(
      switchMap(messaging => new Observable(messaging.onTokenRefresh.bind(messaging)).pipe(
        switchMap(() => messaging.getToken())
      )),
      ɵrunOutsideAngular(zone)
    );

    this.tokenChanges = messaging.pipe(
      switchMap(messaging => messaging.getToken()),
      concat(tokenChanges)
    );

    this.messages = messaging.pipe(
      switchMap(messaging => new Observable(messaging.onMessage.bind(messaging))),
      ɵrunOutsideAngular(zone)
    );

    this.requestToken = of(undefined).pipe(
      switchMap(() => this.requestPermission),
      catchError(() => of(null)),
      mergeMap(() => this.tokenChanges)
    );

    this.deleteToken = (token: string) => messaging.pipe(
      switchMap(messaging => messaging.deleteToken(token)),
      defaultIfEmpty(false),
      ɵrunOutsideAngular(zone)
    );

    return ɵlazySDKProxy(this, messaging, zone);
  }

}
