import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { take, map, switchMap, tap } from 'rxjs/operators'
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

export interface AngularFireAuthGuardOptions {
    check?: (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => (idTokenResult: auth.IdTokenResult | null) => Observable<boolean>
    redirect?: any[]
};

/*
export const loggedInRedirectToItems : AngularFireAuthGuardOptions = {
    check: () => idTokenResult => of(!idTokenResult),
    redirect: ['items']
}

export const redirectToLogin : AngularFireAuthGuardOptions = {
    redirect: ['login']
}

export const adminCanActivate : AngularFireAuthGuardOptions = {
    check: () => idTokenResult => of(!!idTokenResult && idTokenResult.claims.admin == true)
}

export const adminOfProjectCanActivate : AngularFireAuthGuardOptions = {
    check: (next) => idTokenResult => of(!!idTokenResult && idTokenResult.claims[`project-${next.params.id}`] == 'admin')
}*/

@Injectable()
export class AngularFireAuthGuard implements CanActivate {
  constructor(private afAuth: AngularFireAuth, private router: Router) {
  }
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const options : AngularFireAuthGuardOptions = next.data.canActivate || {};
    const user = this.afAuth.user.pipe(take(1));
    var canActivate: Observable<boolean>;
    if (options.check) {
        canActivate = user.pipe(
            switchMap(user => user && user.getIdTokenResult() || of(null)),
            switchMap(options.check(next, state)),
        );
    } else {
        canActivate = user.pipe(
            map(user => !!user)
        )
    }
    return canActivate.pipe(
        tap(canActivate => {
            if (!canActivate && options.redirect) {
                this.router.navigate(options.redirect);
            }
        })
    );
  }
}