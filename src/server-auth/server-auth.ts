import { Injectable, Optional, Inject, PLATFORM_ID, NgZone, InjectionToken } from '@angular/core';
import { FirebaseAppConfig, FirebaseOptions } from '@angular/fire';
import { FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory } from '@angular/fire';
import { isPlatformServer } from '@angular/common';
import * as admin from 'firebase-admin';
import { Request } from 'express';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import * as cookie from 'cookie';

export const CookieAuthCloudFunction = new InjectionToken<string>('angularfire2.cookieAuthCloudFunction');

@Injectable()
export class AngularFireServerAuth {

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    @Inject(REQUEST) request: Request,
    zone: NgZone
  ) {
    if (isPlatformServer(platformId)) {

        const noop = () => {};
        const task = Zone.current.scheduleMacroTask('firebaseZoneBlock', noop, {}, noop, noop);

        zone.runOutsideAngular(() => {

            const auth = _firebaseAppFactory(options, nameOrConfig).auth();

            if (request.headers.cookie) {
                const cookies = cookie.parse(request.headers.cookie![0]);
                if (cookies['session']) {
                    admin.auth().verifySessionCookie(cookies['session'], true)
                        .then(idToken => admin.auth().getUser(idToken.uid))
                        .then(user => admin.auth().createCustomToken(user.uid, user.customClaims))
                        .then(auth.signInWithCustomToken)
                        .then(() => task.invoke())
                        .catch(err => { console.error(err); task.invoke() });
                } else {
                    task.invoke();
                }
            } else {
                task.invoke();
            }

        });
    }
  }

}