import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { Observable, of, from, merge, Subject } from 'rxjs';
import { switchMap, map, observeOn, shareReplay, filter, switchMapTo, withLatestFrom, take } from 'rxjs/operators';
import {
  FIREBASE_OPTIONS,
  FIREBASE_APP_NAME,
  ɵPromiseProxy,
  ɵlazySDKProxy,
  ɵfirebaseAppFactory,
  ɵAngularFireSchedulers,
  ɵkeepUnstableUntilFirstFactory,
  ɵapplyMixins
} from '@angular/fire';
import { isPlatformServer } from '@angular/common';
import { proxyPolyfillCompat } from './base';
import { ɵfetchInstance } from '@angular/fire';
import { Auth, AuthSettings, IdTokenResult, User, UserCredential, Persistence } from '@firebase/auth-types';
import { FirebaseOptions } from '@firebase/app-types';

export interface AngularFireAuth extends ɵPromiseProxy<Auth> {}

type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.auth.use-emulator');

export const SETTINGS = new InjectionToken<Partial<AuthSettings>>('angularfire2.auth.settings');
export const TENANT_ID = new InjectionToken<string>('angularfire2.auth.tenant-id');
export const LANGUAGE_CODE = new InjectionToken<string>('angularfire2.auth.langugage-code');
export const USE_DEVICE_LANGUAGE = new InjectionToken<boolean>('angularfire2.auth.use-device-language');
export const PERSISTENCE = new InjectionToken<Persistence>('angularfire.auth.persistence');

@Injectable({
  providedIn: 'any'
})
export class AngularFireAuth {

  /**
   * Observable of authentication state; as of Firebase 4.0 this is only triggered via sign-in/out
   */
  public readonly authState: Observable<User|null>;

  /**
   * Observable of the currently signed-in user's JWT token used to identify the user to a Firebase service (or null).
   */
  public readonly idToken: Observable<string|null>;

  /**
   * Observable of the currently signed-in user (or null).
   */
  public readonly user: Observable<User|null>;

  /**
   * Observable of the currently signed-in user's IdTokenResult object which contains the ID token JWT string and other
   * helper properties for getting different data associated with the token as well as all the decoded payload claims
   * (or null).
   */
  public readonly idTokenResult: Observable<IdTokenResult|null>;

  /**
   * Observable of the currently signed-in user's credential, or null
   */
  public readonly credential: Observable<UserCredential|null>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string|undefined,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(USE_EMULATOR) providedUseEmulator: any, // can't use the tuple here
    @Optional() @Inject(SETTINGS) providedSettings: any, // can't use AuthSettings here
    @Optional() @Inject(TENANT_ID) tenantId: string | null,
    @Optional() @Inject(LANGUAGE_CODE) languageCode: string | null,
    @Optional() @Inject(USE_DEVICE_LANGUAGE) useDeviceLanguage: boolean | null,
    @Optional() @Inject(PERSISTENCE) persistence: Persistence | null,
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);
    const keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(schedulers);
    const logins = new Subject<UserCredential>();

    const auth = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => import(/* webpackExports: ["getAuth"] */ 'firebase/auth')),
      map(({ getAuth }) => zone.runOutsideAngular(() => {
        // TODO pass in last param
        const app = ɵfirebaseAppFactory(options, zone, platformId, name, undefined);
        const auth = getAuth(app);
        const useEmulator: UseEmulatorArguments | null = providedUseEmulator;
        const settings: Partial<AuthSettings> = providedSettings ?? {};
        return ɵfetchInstance(`${app.name}.auth`, 'AngularFireAuth', app, () => {
          if (useEmulator) {
            // Firebase Auth doesn't conform to the useEmulator convention, let's smooth that over
            // TODO add DI tokens for the second argument
            auth.useEmulator(`http://${useEmulator.join(':')}`);
          }
          if (tenantId) {
            auth.tenantId = tenantId;
          }
          auth.languageCode = languageCode;
          if (useDeviceLanguage) {
            auth.useDeviceLanguage();
          }
          Object.entries(settings).forEach(([key, value]) => {
            auth.settings[key] = value;
          });
          if (persistence) {
            auth.setPersistence(persistence);
          }
          return auth;
        }, [useEmulator, tenantId, languageCode, useDeviceLanguage, persistence]);
      })),
      shareReplay({ bufferSize: 1, refCount: false }),
      take(1),
    );

    if (isPlatformServer(platformId)) {

      this.authState = this.user = this.idToken = this.idTokenResult = this.credential = of(null);

    } else {

      const authWithGetRedirectResult = () => import(/* webpackExports: ["getRedirectResult"] */ 'firebase/auth');
      const redirectResult = of(undefined).pipe(
        switchMap(authWithGetRedirectResult),
        withLatestFrom(auth),
        switchMap(([{ getRedirectResult }, auth]) => getRedirectResult(auth)),
        keepUnstableUntilFirst,
        shareReplay({ bufferSize: 1, refCount: false }),
      );

      const authWithOnAuthStateChanged = () => import(/* webpackExports: ["onAuthStateChanged"] */ 'firebase/auth');
      this.authState = redirectResult.pipe(
        switchMap(authWithOnAuthStateChanged),
        withLatestFrom(auth),
        switchMap(([{ onAuthStateChanged }, auth]) => new Observable<User|null>(sub =>
          onAuthStateChanged(auth, u => sub.next(u), e => sub.error(e), () => sub.complete())
        )),
      );

      const authWithOnIdTokenChanged = () => import(/* webpackExports: ["onIdTokenChanged"] */ 'firebase/auth');
      this.user = redirectResult.pipe(
        switchMap(authWithOnIdTokenChanged),
        withLatestFrom(auth),
        switchMap(([{ onIdTokenChanged }, auth]) => new Observable<User|null>(sub =>
          onIdTokenChanged(auth, u => sub.next(u), e => sub.error(e), () => sub.complete())
        )),
      );

      this.idToken = this.user.pipe(
        switchMap(user => user ? from(user.getIdToken()) : of(null))
      );

      this.idTokenResult = this.user.pipe(
        switchMap(user => user ? from(user.getIdTokenResult()) : of(null))
      );

      this.credential = merge(
        redirectResult,
        logins,
        // pipe in null authState to make credential zipable, just a weird devexp if
        // authState and user go null to still have a credential
        this.authState.pipe(filter(it => !it)) as Observable<null>
      );

    }

    // TODO how should I intercept signIn/Out now?
    return ɵlazySDKProxy(this, auth, zone);

  }

}

ɵapplyMixins(AngularFireAuth, [proxyPolyfillCompat]);
