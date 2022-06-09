import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { Observable, of, from, merge, Subject } from 'rxjs';
import { switchMap, map, observeOn, shareReplay, first, filter, switchMapTo, subscribeOn } from 'rxjs/operators';
import { ɵAngularFireSchedulers, keepUnstableUntilFirst } from '@angular/fire';
import { ɵlazySDKProxy, ɵPromiseProxy, ɵapplyMixins } from '@angular/fire/compat';
import { ɵfirebaseAppFactory, FIREBASE_OPTIONS, FIREBASE_APP_NAME, FirebaseApp, ɵcacheInstance } from '@angular/fire/compat';
import { FirebaseOptions } from 'firebase/app';
import firebase from 'firebase/compat/app';
import { isPlatformServer } from '@angular/common';
import { proxyPolyfillCompat } from './base';
import { AppCheckInstances } from '@angular/fire/app-check';

export interface AngularFireAuth extends ɵPromiseProxy<firebase.auth.Auth> {}

type UseEmulatorArguments = Parameters<firebase.auth.Auth['useEmulator']>;
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.auth.use-emulator');

export const SETTINGS = new InjectionToken<firebase.auth.AuthSettings>('angularfire2.auth.settings');
export const TENANT_ID = new InjectionToken<string>('angularfire2.auth.tenant-id');
export const LANGUAGE_CODE = new InjectionToken<string>('angularfire2.auth.langugage-code');
export const USE_DEVICE_LANGUAGE = new InjectionToken<boolean>('angularfire2.auth.use-device-language');
export const PERSISTENCE = new InjectionToken<string>('angularfire.auth.persistence');

export const ɵauthFactory = (
  app: FirebaseApp, zone: NgZone, useEmulator: UseEmulatorArguments|null,
  tenantId: string, languageCode: string|null, useDeviceLanguage: boolean|null,
  settings: firebase.auth.AuthSettings|null, persistence: string|null,
) => ɵcacheInstance(`${app.name}.auth`, 'AngularFireAuth', app.name, () => {
  const auth = zone.runOutsideAngular(() => app.auth());
  if (useEmulator) {
    auth.useEmulator(...useEmulator);
  }
  if (tenantId) {
    auth.tenantId = tenantId;
  }
  auth.languageCode = languageCode;
  if (useDeviceLanguage) {
    auth.useDeviceLanguage();
  }
  if (settings) {
    for (const [k, v] of Object.entries(settings)) {
      auth.settings[k] = v;
    }
  }
  if (persistence) {
    auth.setPersistence(persistence);
  }
  return auth;
}, [useEmulator, tenantId, languageCode, useDeviceLanguage, settings, persistence]);

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

  /**
   * Observable of the currently signed-in user's credential, or null
   */
  public readonly credential: Observable<Required<firebase.auth.UserCredential>|null>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string|null|undefined,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    schedulers: ɵAngularFireSchedulers,
    @Optional() @Inject(USE_EMULATOR) useEmulator: any, // can't use the tuple here
    @Optional() @Inject(SETTINGS) settings: any, // can't use firebase.auth.AuthSettings here
    @Optional() @Inject(TENANT_ID) tenantId: string | null,
    @Optional() @Inject(LANGUAGE_CODE) languageCode: string | null,
    @Optional() @Inject(USE_DEVICE_LANGUAGE) useDeviceLanguage: boolean | null,
    @Optional() @Inject(PERSISTENCE) persistence: string | null,
    @Optional() _appCheckInstances: AppCheckInstances,
  ) {
    const logins = new Subject<Required<firebase.auth.UserCredential>>();

    const auth = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => zone.runOutsideAngular(() => import('firebase/compat/auth'))),
      map(() => ɵfirebaseAppFactory(options, zone, name)),
      map(app => ɵauthFactory(app, zone, useEmulator, tenantId, languageCode, useDeviceLanguage, settings, persistence)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    if (isPlatformServer(platformId)) {

      this.authState = this.user = this.idToken = this.idTokenResult = this.credential = of(null);

    } else {

      // HACK, as we're exporting auth.Auth, rather than auth, developers importing firebase.auth
      //       (e.g, `import { auth } from 'firebase/compat/app'`) are getting an undefined auth object unexpectedly
      //       as we're completely lazy. Let's eagerly load the Auth SDK here.
      //       There could potentially be race conditions still... but this greatly decreases the odds while
      //       we reevaluate the API.
      const _ = auth.pipe(first()).subscribe();

      const redirectResult = auth.pipe(
        switchMap(auth => auth.getRedirectResult().then(it => it, () => null)),
        keepUnstableUntilFirst,
        shareReplay({ bufferSize: 1, refCount: false }),
      );

      const authStateChanged = auth.pipe(
        switchMap(auth => new Observable<firebase.User|null>(sub =>
          ({ unsubscribe: zone.runOutsideAngular(() => auth.onAuthStateChanged(
            next => sub.next(next),
            err => sub.error(err),
            () => sub.complete()
          ))})
        )),
      );

      const idTokenChanged = auth.pipe(
        switchMap(auth => new Observable<firebase.User|null>(sub =>
          ({ unsubscribe: zone.runOutsideAngular(() => auth.onIdTokenChanged(
            next => sub.next(next),
            err => sub.error(err),
            () => sub.complete()
          ))})
        ))
      );

      this.authState = redirectResult.pipe(
        switchMapTo(authStateChanged),
        subscribeOn(schedulers.outsideAngular),
        observeOn(schedulers.insideAngular),
      );

      this.user = redirectResult.pipe(
        switchMapTo(idTokenChanged),
        subscribeOn(schedulers.outsideAngular),
        observeOn(schedulers.insideAngular),
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
        this.authState.pipe(filter(it => !it))
      ).pipe(
        // handle the { user: { } } when a user is already logged in, rather have null
        // TODO handle the type corcersion better
        map(credential => credential?.user ? credential as Required<firebase.auth.UserCredential> : null),
        subscribeOn(schedulers.outsideAngular),
        observeOn(schedulers.insideAngular),
      );

    }

    return ɵlazySDKProxy(this, auth, zone, { spy: {
      apply: (name, _, val) => {
        // If they call a signIn or createUser function listen into the promise
        // this will give us the user credential, push onto the logins Subject
        // to be consumed in .credential
        if (name.startsWith('signIn') || name.startsWith('createUser')) {
          // TODO fix the types, the trouble is UserCredential has everything optional
          val.then((user: firebase.auth.UserCredential) => logins.next(user as any));
        }
      }
    }});

  }

}

ɵapplyMixins(AngularFireAuth, [proxyPolyfillCompat]);
