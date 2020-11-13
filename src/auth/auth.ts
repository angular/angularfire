import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { switchMap, map, observeOn, shareReplay, first } from 'rxjs/operators';
import {
  FIREBASE_OPTIONS,
  FIREBASE_APP_NAME,
  FirebaseOptions,
  FirebaseAppConfig,
  ɵPromiseProxy,
  ɵlazySDKProxy,
  ɵfirebaseAppFactory,
  ɵAngularFireSchedulers,
  ɵkeepUnstableUntilFirstFactory,
  ɵapplyMixins
} from '@angular/fire';
import firebase from 'firebase/app';
import { isPlatformServer } from '@angular/common';
import { proxyPolyfillCompat } from './base';

export interface AngularFireAuth extends ɵPromiseProxy<firebase.auth.Auth> {}

type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.auth.use-emulator');

export const SETTINGS = new InjectionToken<firebase.auth.AuthSettings>('angularfire2.auth.settings');
export const TENANT_ID = new InjectionToken<string>('angularfire2.auth.tenant-id');
export const LANGUAGE_CODE = new InjectionToken<string>('angularfire2.auth.langugage-code');
export const USE_DEVICE_LANGUAGE = new InjectionToken<boolean>('angularfire2.auth.use-device-language');
export const PERSISTENCE = new InjectionToken<string>('angularfire.auth.persistence');

@Injectable({
  providedIn: 'any'
})
export class AngularFireAuth {

  /**
   * Observable of authentication state; as of Firebase 4.0 this is only triggered via sign-in/out
   */
  public readonly authState: Observable<firebase.User|null>;

  /**
   * Observable of the currently signed-in user's JWT token used to identify the user to a Firebase service (or null).
   */
  public readonly idToken: Observable<string|null>;

  /**
   * Observable of the currently signed-in user (or null).
   */
  public readonly user: Observable<firebase.User|null>;

  /**
   * Observable of the currently signed-in user's IdTokenResult object which contains the ID token JWT string and other
   * helper properties for getting different data associated with the token as well as all the decoded payload claims
   * (or null).
   */
  public readonly idTokenResult: Observable<firebase.auth.IdTokenResult|null>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string|FirebaseAppConfig|null|undefined,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any, // can't use the tuple here
    @Optional() @Inject(SETTINGS) _settings: any, // can't use firebase.auth.AuthSettings here
    @Optional() @Inject(TENANT_ID) tenantId: string | null,
    @Optional() @Inject(LANGUAGE_CODE) languageCode: string | null,
    @Optional() @Inject(USE_DEVICE_LANGUAGE) useDeviceLanguage: boolean | null,
    @Optional() @Inject(PERSISTENCE) persistence: string | null,
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);
    const keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(schedulers);

    const auth = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => zone.runOutsideAngular(() => import('firebase/auth'))),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => zone.runOutsideAngular(() => {
        const auth = app.auth();
        const useEmulator: UseEmulatorArguments | null = _useEmulator;
        if (useEmulator) {
          // Firebase Auth doesn't conform to the useEmulator convention, let's smooth that over
          auth.useEmulator(`http://${useEmulator.join(':')}`);
        }
        if (tenantId) {
          auth.tenantId = tenantId;
        }
        auth.languageCode = languageCode;
        if (useDeviceLanguage) {
          auth.useDeviceLanguage();
        }
        const settings: firebase.auth.AuthSettings | null = _settings;
        if (settings) {
          auth.settings = settings;
        }
        if (persistence) {
          auth.setPersistence(persistence);
        }
        return auth;
      })),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    if (isPlatformServer(platformId)) {

      this.authState = this.user = this.idToken = this.idTokenResult = of(null);

    } else {

      // HACK, as we're exporting auth.Auth, rather than auth, developers importing firebase.auth
      //       (e.g, `import { auth } from 'firebase/app'`) are getting an undefined auth object unexpectedly
      //       as we're completely lazy. Let's eagerly load the Auth SDK here.
      //       There could potentially be race conditions still... but this greatly decreases the odds while
      //       we reevaluate the API.
      const _ = auth.pipe(first()).subscribe();

      this.authState = auth.pipe(
        switchMap(auth => auth.getRedirectResult().then(() => auth, () => auth)),
        switchMap(auth => zone.runOutsideAngular(() => new Observable<firebase.User|null>(auth.onAuthStateChanged.bind(auth)))),
        keepUnstableUntilFirst
      );

      this.user = auth.pipe(
        switchMap(auth => auth.getRedirectResult().then(() => auth, () => auth)),
        switchMap(auth => zone.runOutsideAngular(() => new Observable<firebase.User|null>(auth.onIdTokenChanged.bind(auth)))),
        keepUnstableUntilFirst
      );

      this.idToken = this.user.pipe(
        switchMap(user => user ? from(user.getIdToken()) : of(null))
      );

      this.idTokenResult = this.user.pipe(
        switchMap(user => user ? from(user.getIdTokenResult()) : of(null))
      );

    }

    return ɵlazySDKProxy(this, auth, zone);

  }

}

ɵapplyMixins(AngularFireAuth, [proxyPolyfillCompat]);
