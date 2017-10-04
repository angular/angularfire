import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from './auth';

import * as jwt from 'firebase/utils/jwt';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/do';

export interface AngularFireAuthGuardOptions {
    claims?: (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => (a: any) => boolean
    redirect?: any[]
};

@Injectable()
export class AngularFireAuthGuard implements CanActivate {
  constructor(private afAuth: AngularFireAuth, private router: Router) {
  }
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const options : AngularFireAuthGuardOptions = next.data.canActivate || {};
    const claimsMap = options.claims || (() => claims => Object.keys(claims).length > 0);
    return this.afAuth.idToken
        .take(1)
        .map(idToken => jwt.decode(idToken).claims)
        .map(claimsMap(next, state))
        .do(canActivate => {
            if (!canActivate && options.redirect && options.redirect.length > 0) {
                this.router.navigate(options.redirect);
            }
        });
  }
}
