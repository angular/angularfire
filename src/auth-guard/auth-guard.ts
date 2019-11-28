import { Injectable} from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of, pipe, UnaryFunction } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators'
import { User } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';

export type AuthPipeGenerator = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => AuthPipe;
export type AuthPipe = UnaryFunction<Observable<User|null>, Observable<boolean|any[]>>;

@Injectable()
export class AngularFireAuthGuard implements CanActivate {

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const authPipeFactory: AuthPipeGenerator = next.data.authGuardPipe || (() => loggedIn);
    return this.afAuth.user.pipe(
        take(1),
        authPipeFactory(next, state),
        map(canActivate => typeof canActivate == "boolean" ? canActivate : this.router.createUrlTree(canActivate))
    );
  }

}

export const canActivate = (pipe: AuthPipe|AuthPipeGenerator) => ({
    canActivate: [ AngularFireAuthGuard ], data: { authGuardPipe: pipe.name === "" ? pipe : () => pipe}
});

export const loggedIn: AuthPipe = map(user => !!user);
export const isNotAnonymous: AuthPipe = map(user => !!user && !user.isAnonymous);
export const idTokenResult = switchMap((user: User|null) => user ? user.getIdTokenResult() : of(null));
export const emailVerified: AuthPipe = map(user => !!user && user.emailVerified);
export const customClaims = pipe(idTokenResult, map(idTokenResult => idTokenResult ? idTokenResult.claims : []));
export const hasCustomClaim = (claim:string) => pipe(customClaims, map(claims =>  claims.hasOwnProperty(claim)));
export const redirectUnauthorizedTo = (redirect: any[]) => pipe(loggedIn, map(loggedIn => loggedIn || redirect));
export const redirectLoggedInTo = (redirect: any[]) =>  pipe(loggedIn, map(loggedIn => loggedIn && redirect || true));
