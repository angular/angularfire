import { Injectable, InjectionToken } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable, of, pipe, UnaryFunction } from 'rxjs';
import { map, switchMap } from 'rxjs/operators'
import { User, auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';

export const EnableRouterGuardListeners = new InjectionToken<boolean>('angularfire2.enableRouterGuardListeners');

export type UserAndRouterState = [User|null, ActivatedRouteSnapshot, RouterStateSnapshot];
export type AuthPipe = UnaryFunction<Observable<UserAndRouterState>, Observable<boolean|any[]>>;

@Injectable()
export class AngularFireAuthGuard implements CanActivate {

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const authPipe: AuthPipe = next.data.angularFireAuthPipe || loggedIn;
    return this.afAuth.user.pipe(
        map(user => [user, next, state]),
        authPipe,
        map(canActivate => typeof canActivate == "boolean" ? canActivate : this.router.createUrlTree(canActivate))
    );
  }

}

export const canActivate = (angularFireAuthPipe: AuthPipe) => ({
    canActivate: [ AngularFireAuthGuard ], data: { angularFireAuthPipe }
});

export const loggedIn = map(([user]:UserAndRouterState) => !!user);
export const isNotAnonymous = map(([user]:UserAndRouterState) => !!user && !user.isAnonymous);
export const idTokenResult = switchMap(([user]:UserAndRouterState) => user ? user.getIdTokenResult() : of(null));
export const emailVerified = map(([user]:UserAndRouterState) => !!user && user.emailVerified);
export const customClaims = pipe(idTokenResult, map(idTokenResult => !!idTokenResult ? idTokenResult.claims : []));
export const hasCustomClaim = (claim:string) => pipe(customClaims, map(claims =>  claims.hasOwnProperty(claim)));
export const redirectUnauthorizedTo = (redirect: any[]) => pipe(loggedIn, map(loggedIn => loggedIn || redirect));
export const redirectLoggedInTo = (redirect: any[]) =>  pipe(loggedIn, map(loggedIn => loggedIn && redirect || true));