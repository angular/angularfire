import { Inject, Injectable, NgZone, Optional } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of, pipe, UnaryFunction } from 'rxjs';
import { map, observeOn, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import firebase from 'firebase/app';
import {
  ɵAngularFireSchedulers,
  FirebaseOptions,
  FirebaseAppConfig,
  FIREBASE_OPTIONS,
  FIREBASE_APP_NAME,
  ɵfirebaseAppFactory,
  ɵkeepUnstableUntilFirstFactory
} from '@angular/fire';

export type AuthPipeGenerator = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => AuthPipe;
export type AuthPipe = UnaryFunction<Observable<firebase.User|null>, Observable<boolean|string|any[]>>;

export const loggedIn: AuthPipe = map(user => !!user);

@Injectable({
  providedIn: 'any'
})
export class AngularFireAuthGuard implements CanActivate {

  authState: Observable<firebase.User|null>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string|FirebaseAppConfig|null|undefined,
    zone: NgZone,
    private router: Router
  ) {

    const schedulers = new ɵAngularFireSchedulers(zone);
    const keepUnstableUntilFirst = ɵkeepUnstableUntilFirstFactory(schedulers);

    const auth = of(undefined).pipe(
      observeOn(new ɵAngularFireSchedulers(zone).outsideAngular),
      switchMap(() => zone.runOutsideAngular(() => import('firebase/auth'))),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => zone.runOutsideAngular(() => app.auth())),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.authState = auth.pipe(
      switchMap(auth => new Observable<firebase.User|null>(auth.onAuthStateChanged.bind(auth))),
      keepUnstableUntilFirst
    );
  }

  canActivate = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authPipeFactory = next.data.authGuardPipe as AuthPipeGenerator || (() => loggedIn);
    return this.authState.pipe(
      take(1),
      authPipeFactory(next, state),
      map(can => {
        if (typeof can === 'boolean') {
          return can;
        } else if (Array.isArray(can)) {
          return this.router.createUrlTree(can);
        } else {
          // TODO(EdricChan03): Add tests
          return this.router.parseUrl(can);
        }
      })
    );
  }

}

export const canActivate = (pipe: AuthPipeGenerator) => ({
  canActivate: [ AngularFireAuthGuard ], data: { authGuardPipe: pipe }
});


export const isNotAnonymous: AuthPipe = map(user => !!user && !user.isAnonymous);
export const idTokenResult = switchMap((user: firebase.User|null) => user ? user.getIdTokenResult() : of(null));
export const emailVerified: AuthPipe = map(user => !!user && user.emailVerified);
export const customClaims = pipe(idTokenResult, map(idTokenResult => idTokenResult ? idTokenResult.claims : []));
export const hasCustomClaim: (claim: string) => AuthPipe =
  (claim) => pipe(customClaims, map(claims =>  claims.hasOwnProperty(claim)));
export const redirectUnauthorizedTo: (redirect: string|any[]) => AuthPipe =
  (redirect) => pipe(loggedIn, map(loggedIn => loggedIn || redirect));
export const redirectLoggedInTo: (redirect: string|any[]) => AuthPipe =
  (redirect) => pipe(loggedIn, map(loggedIn => loggedIn && redirect || true));
