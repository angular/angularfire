import { Injectable, Inject, Optional, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { messaging } from 'firebase';
import { requestPermission } from './observable/request-permission';
import { Observable, empty, from, of, throwError } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig } from 'angularfire2';
import { FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory, FirebaseZoneScheduler } from 'angularfire2';

@Injectable()
export class AngularFireMessaging {
  messaging: messaging.Messaging;
  requestPermission: Observable<void>;
  getToken: Observable<string|null>;
  tokenChanges: Observable<string|null>;
  messages: Observable<{}>;
  requestToken: Observable<string|null>;
  deleteToken: (string) => Observable<boolean>;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {
    const scheduler = new FirebaseZoneScheduler(zone, platformId);
    this.messaging = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, nameOrConfig);
      return app.messaging();
    });

    if (isPlatformBrowser(platformId)) {

      this.requestPermission = scheduler.runOutsideAngular(
        requestPermission(this.messaging)
      );

      this.getToken = scheduler.runOutsideAngular(
        from(this.messaging.getToken())
      );

      this.tokenChanges = scheduler.runOutsideAngular(
        new Observable(subscriber => {
          this.messaging.getToken().then(t => subscriber.next(t));
          this.messaging.onTokenRefresh(subscriber.next);
        })
      );

      this.messages = scheduler.runOutsideAngular(
        new Observable(subscriber => {
          this.messaging.onMessage(subscriber.next);
        })
      );

      this.requestToken = this.requestPermission.pipe(
        catchError(() => of(null)),
        mergeMap(() => this.tokenChanges),
      );

    } else {

      this.requestPermission = throwError('Not available on server platform.');
      this.getToken = of(null);
      this.tokenChanges = of(null);
      this.messages = empty();
      this.requestToken = of(null);

    }

    this.deleteToken = (token: string) => scheduler.runOutsideAngular(
      from(this.messaging.deleteToken(token))
    );
  }

}