import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, NavigationExtras } from '@angular/router';
import { Observable, of } from 'rxjs';
import { take, map, switchMap, tap } from 'rxjs/operators'
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

export interface AngularFireAuthGuardOptions {
    authorizationCheck?: (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => (idTokenResult: auth.IdTokenResult | null) => Observable<boolean>
    redirectUnauthorizedTo?: any[],
    redirectNavigationExtras?: NavigationExtras
};

@Injectable()
export class AngularFireAuthGuard implements CanActivate {
  constructor(private afAuth: AngularFireAuth, private router: Router) {
  }
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const options : AngularFireAuthGuardOptions = next.data.canActivate || {};
    const redirect = options.redirectUnauthorizedTo && this.router.createUrlTree(options.redirectUnauthorizedTo, options.redirectNavigationExtras);
    const user = this.afAuth.user.pipe(take(1));
    var canActivate: Observable<boolean>;
    if (options.authorizationCheck) {
        canActivate = user.pipe(
            switchMap(user => user && user.getIdTokenResult() || of(null)),
            switchMap(options.authorizationCheck(next, state)),
        );
    } else {
        canActivate = user.pipe(
            map(user => !!user)
        )
    }
    return canActivate.pipe(
        map(canActivate => canActivate || redirect || false)
    );
  }
}

export const routeHelper = (data: AngularFireAuthGuardOptions) => ({
    canActivate: [ AngularFireAuthGuard ], data
});

export const hasClaim = (claim: string, redirect?: any[]) => routeHelper({
    authorizationCheck: () => idTokenResult => of(!!idTokenResult && idTokenResult.claims.hasOwnProperty(claim)),
    redirectUnauthorizedTo: redirect
});

export const claimEquals = (claim: string, value: any, redirect?: any[]) => routeHelper({
    authorizationCheck: () => idTokenResult => of(!!idTokenResult && idTokenResult.claims[claim] === value),
    redirectUnauthorizedTo: redirect
});

export const redirectUnauthorizedTo = (redirect: any[]) => routeHelper({
    redirectUnauthorizedTo: redirect
});

export const redirectLoggedInTo = (redirect: any[]) =>  routeHelper({
    authorizationCheck: () => idTokenResult => of(!idTokenResult),
    redirectUnauthorizedTo: redirect
});