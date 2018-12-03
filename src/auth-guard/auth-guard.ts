import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { take, map, switchMap, tap } from 'rxjs/operators'
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

export interface AngularFireAuthGuardOptions {
    authorizationCheck?: (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => (idTokenResult: auth.IdTokenResult | null) => Observable<boolean>
    redirectUnauthorizedTo?: any[]
};

export const routeHelper = (data: AngularFireAuthGuardOptions) => ({
    canActivate: [ AngularFireAuthGuard ], data
});

@Injectable()
export class AngularFireAuthGuard implements CanActivate {
  constructor(private afAuth: AngularFireAuth, private router: Router) {
  }
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const options : AngularFireAuthGuardOptions = next.data.canActivate || {};
    const redirect = options.redirectUnauthorizedTo && this.router.createUrlTree(options.redirectUnauthorizedTo);
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