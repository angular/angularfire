import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { messaging } from 'firebase/app';
import { Observable, empty, from, of, throwError } from 'rxjs';
import { mergeMap, catchError, map, switchMap, concat, observeOn, defaultIfEmpty } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig, ɵAngularFireSchedulers, FIREBASE_APP_NAME, FIREBASE_OPTIONS, ɵlazySDKProxy, ɵPromiseProxy } from '@angular/fire';
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
    const schedulers = new ɵAngularFireSchedulers(zone);

    // @ts-ignore zapping in the UMD in the build script
    const requireMessaging = from(import('firebase/messaging'));

    const messaging = requireMessaging.pipe(
      observeOn(schedulers.outsideAngular),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.messaging()),
      catchError(err => err.message === 'Not supported' ? empty() : throwError(err) )
    );

    if (!isPlatformServer(platformId)) {

      this.requestPermission = messaging.pipe(
        observeOn(schedulers.outsideAngular),
        switchMap(messaging => messaging.requestPermission()),
      );
    
    } else {
    
      this.requestPermission = throwError('Not available on server platform.');
    
    }

    this.getToken = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => messaging.getToken()),
      defaultIfEmpty(null)
    )

    const tokenChanges = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => new Observable(messaging.onTokenRefresh.bind(messaging)).pipe(
        switchMap(() => messaging.getToken())
      ))
    );

    this.tokenChanges = messaging.pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(messaging => messaging.getToken()),
      concat(tokenChanges)
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
