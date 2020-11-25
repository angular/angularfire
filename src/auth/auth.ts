import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { Observable, of, from, merge, Subject, Subscriber } from 'rxjs';
import { switchMap, map, observeOn, shareReplay, first, filter, switchMapTo, subscribeOn, tap, take, mapTo } from 'rxjs/operators';
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
import { ɵfetchInstance } from '@angular/fire';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { experimental } from '@angular-devkit/core';

export interface AngularFireAuth extends ɵPromiseProxy<firebase.auth.Auth> {}

type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.auth.use-emulator');

export const SETTINGS = new InjectionToken<firebase.auth.AuthSettings>('angularfire2.auth.settings');
export const TENANT_ID = new InjectionToken<string>('angularfire2.auth.tenant-id');
export const LANGUAGE_CODE = new InjectionToken<string>('angularfire2.auth.langugage-code');
export const USE_DEVICE_LANGUAGE = new InjectionToken<boolean>('angularfire2.auth.use-device-language');
export const PERSISTENCE = new InjectionToken<string>('angularfire.auth.persistence');
export const EXPERIMENTAL_COOKIE_AUTH = new InjectionToken<boolean>('angularfire.auth.ssr-auth');

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
  public readonly credential: Observable<firebase.auth.UserCredential|null>;

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
    @Optional() @Inject(EXPERIMENTAL_COOKIE_AUTH) experimentalCookieAuth: boolean | null,
    @Optional() @Inject(REQUEST) request: any,
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);
    const keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(schedulers);
    const logins = new Subject<Required<firebase.auth.UserCredential>>();

    const auth = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => zone.runOutsideAngular(() => import('firebase/auth'))),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => zone.runOutsideAngular(() => {
        const useEmulator: UseEmulatorArguments | null = _useEmulator;
        const settings: firebase.auth.AuthSettings | null = _settings;
        return ɵfetchInstance(`${app.name}.auth`, 'AngularFireAuth', app, () => {
          const auth = zone.runOutsideAngular(() => app.auth());
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
          if (settings) {
            auth.settings = settings;
          }
          if (experimentalCookieAuth) {
            auth.setPersistence('none');
            if (persistence && typeof console !== 'undefined') {
              console.warn('Experimental cookie auth overrides persistence to NONE.');
            }
          } else if (persistence) {
            auth.setPersistence(persistence);
          }
          return auth;
        }, [useEmulator, tenantId, languageCode, useDeviceLanguage, settings, persistence]);
      })),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    const cookieAuthCredential = auth.pipe(
      switchMap(auth => {
        // grabbed from ngx-cookie-service, they don't support universal
        const getCookieRegExp = (name: string): RegExp => {
          const escapedName: string = name.replace(/([\[\]\{\}\(\)\|\=\;\+\?\,\.\*\^\$])/gi, '\\$1');
          return new RegExp('(?:^' + escapedName + '|;\\s*' + escapedName + ')=(.*?)(?:;|$)', 'g');
        };
        const cookie = isPlatformServer(platformId) ? request.headers.cookie : document.cookie;
        const session = getCookieRegExp('session').exec(cookie)?.[1];
        if (session) {
          const authCredentialJSON = JSON.parse(decodeURIComponent(session));
          const credentialUid = authCredentialJSON._uid;
          delete authCredentialJSON._uid;
          const authCredential = firebase.auth.AuthCredential.fromJSON(authCredentialJSON);
          // TODO investigate, this is likely a security concern but is there a way we could utilize this property
          //      perhaps we can build the _uid into the application name?
          if (auth.currentUser?.uid === credentialUid) {
            return of({ user: auth.currentUser, additionalUserInfo: null, credential: authCredential, operationType: null });
          } else {
            return auth.signInWithCredential(authCredential);
          }
        } else {
          return of(null);
        }
      }),
      map(credential => credential?.user ? credential as firebase.auth.UserCredential : null),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    // HACK, as we're exporting auth.Auth, rather than auth, developers importing firebase.auth
    //       (e.g, `import { auth } from 'firebase/app'`) are getting an undefined auth object unexpectedly
    //       as we're completely lazy. Let's eagerly load the Auth SDK here.
    //       There could potentially be race conditions still... but this greatly decreases the odds while
    //       we reevaluate the API.
    const _ = auth.pipe(first()).subscribe();

    const cookieAuthUser = cookieAuthCredential.pipe(
      map(it => it?.user)
    );

    if (isPlatformServer(platformId)) {

      if (experimentalCookieAuth) {

        this.user = this.authState = cookieAuthUser;
        this.credential = cookieAuthCredential;

      } else {

        this.user = this.authState = this.credential = of(null);

      }

    } else {

      const redirectResult = auth.pipe(
        switchMap(auth => auth.getRedirectResult().then(it => it, () => null)),
        experimentalCookieAuth ? switchMap(it => cookieAuthCredential.pipe(map(() => it))) : tap(),
        keepUnstableUntilFirst,
        shareReplay({ bufferSize: 1, refCount: false }),
      );

      const fromCallback = <T = any>(cb: (sub: Subscriber<T>) => () => void) => new Observable<T>(subscriber =>
        ({ unsubscribe: zone.runOutsideAngular(() => cb(subscriber)) })
      );

      const authStateChanged = auth.pipe(
        switchMap(auth => fromCallback(auth.onAuthStateChanged.bind(auth))),
      );

      const idTokenChanged = auth.pipe(
        switchMap(auth => fromCallback(auth.onIdTokenChanged.bind(auth)))
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

      this.credential = merge(
        redirectResult,
        logins,
        // pipe in null authState to make credential zipable, just a weird devexp if
        // authState and user go null to still have a credential
        this.authState.pipe(filter(it => !it))
      ).pipe(
        // handle the { user: { } } when a user is already logged in, rather have null
        // TODO handle the type corcersion better
        map(credential => credential?.user ? credential : null),
        subscribeOn(schedulers.outsideAngular),
        observeOn(schedulers.insideAngular),
      );

      if (experimentalCookieAuth) {

        /* TODO add the side-effects
           it's now seeming like this should be a service instead

          this.cookieExchangeDisposable = this.credential.pipe(
            filter(it => !!it),
            tap(it => console.log(it.credential)),
          ).subscribe(userCredential => {
            const json = userCredential.credential.toJSON();
            // TODO do we want to put the instanceId on here too?
            //      any other properties that we can use from the server side?
            json['_uid'] = userCredential.user.uid;
            // are we taking on ngx-cookie?
            cookies.set('session', JSON.stringify(json));
          });

          this.user.pipe(
            pairwise(),
            filter(([a,b]) => !!a && !b)
          ).subscribe(() => {
            cookies.delete('session');
          });
        */

      }

    }

    this.idToken = this.user.pipe(
      switchMap(user => user ? from(user.getIdToken()) : of(null))
    );

    this.idTokenResult = this.user.pipe(
      switchMap(user => user ? from(user.getIdTokenResult()) : of(null))
    );

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
