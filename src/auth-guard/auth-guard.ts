import { Inject, Injectable, NgZone, Optional } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of, pipe, UnaryFunction } from 'rxjs';
import { map, observeOn, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { User } from 'firebase/app';
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
export type AuthPipe = UnaryFunction<Observable<User|null>, Observable<boolean|any[]>>;

export const loggedIn: AuthPipe = map(user => !!user);

@Injectable({
  providedIn: 'any'
})
export class AngularFireAuthGuard implements CanActivate {

  authState: Observable<User|null>;

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
      switchMap(auth => new Observable<User|null>(auth.onAuthStateChanged.bind(auth))),
      keepUnstableUntilFirst
    );
  }

  canActivate = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authPipeFactory = next.data.authGuardPipe as AuthPipeGenerator || (() => loggedIn);
    return this.authState.pipe(
      take(1),
      authPipeFactory(next, state),
      map(can => typeof can === 'boolean' ? can : this.router.createUrlTree(can as any[]))
    );
  }

}

export const canActivate = (pipe: AuthPipeGenerator) => ({
    canActivate: [ AngularFireAuthGuard ], data: { authGuardPipe: pipe }
});


export const isNotAnonymous: AuthPipe = map(user => !!user && !user.isAnonymous);
export const idTokenResult = switchMap((user: User|null) => user ? user.getIdTokenResult() : of(null));
export const emailVerified: AuthPipe = map(user => !!user && user.emailVerified);
export const customClaims = pipe(idTokenResult, map(idTokenResult => idTokenResult ? idTokenResult.claims : []));
export const hasCustomClaim: (claim: string) => AuthPipe =
  (claim) => pipe(customClaims, map(claims =>  claims.hasOwnProperty(claim)));
export const redirectUnauthorizedTo: (redirect: any[]) => AuthPipe =
  (redirect) => pipe(loggedIn, map(loggedIn => loggedIn || redirect));
export const redirectLoggedInTo: (redirect: any[]) => AuthPipe =
  (redirect) => pipe(loggedIn, map(loggedIn => loggedIn && redirect || true));
