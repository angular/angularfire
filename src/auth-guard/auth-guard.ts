import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of, pipe, UnaryFunction } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { Auth, user } from '@angular/fire/auth';
import { User } from 'firebase/auth';

export type AuthPipeGenerator = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => AuthPipe;
export type AuthPipe = UnaryFunction<Observable<User|null>, Observable<boolean|string|any[]>>;

export const loggedIn: AuthPipe = map(user => !!user);

@Injectable({
  providedIn: 'any'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private auth: Auth) {}

  canActivate = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authPipeFactory = next.data.authGuardPipe as AuthPipeGenerator || (() => loggedIn);
    return user(this.auth).pipe(
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
  canActivate: [ AuthGuard ], data: { authGuardPipe: pipe }
});

export const isNotAnonymous: AuthPipe = map(user => !!user && !user.isAnonymous);
export const idTokenResult = switchMap((user: User|null) => user ? user.getIdTokenResult() : of(null));
export const emailVerified: AuthPipe = map(user => !!user && user.emailVerified);
export const customClaims = pipe(idTokenResult, map(idTokenResult => idTokenResult ? idTokenResult.claims : []));
export const hasCustomClaim: (claim: string) => AuthPipe =
  (claim) => pipe(customClaims, map(claims =>  claims.hasOwnProperty(claim)));
export const redirectUnauthorizedTo: (redirect: string|any[]) => AuthPipe =
  (redirect) => pipe(loggedIn, map(loggedIn => loggedIn || redirect));
export const redirectLoggedInTo: (redirect: string|any[]) => AuthPipe =
  (redirect) => pipe(loggedIn, map(loggedIn => loggedIn && redirect || true));
