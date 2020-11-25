import { Component, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import { Subscription } from 'rxjs';
import { filter, map, pairwise, tap } from 'rxjs/operators';
import { trace } from '@angular/fire/performance';
import { Inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-auth',
  template: `
    <p>
      Auth!
      {{ (auth.user | async)?.uid | json }}
      {{ (auth.credential | async)?.additionalUserInfo?.isNewUser | json }}
      <button (click)="login()" *ngIf="showLoginButton">Log in with Google</button>
      <button (click)="loginAnonymously()" *ngIf="showLoginButton">Log in anonymously</button>
      <button (click)="logout()" *ngIf="showLogoutButton">Log out</button>
    </p>
  `,
  styles: []
})
export class AuthComponent implements OnInit, OnDestroy {

  private readonly userDisposable: Subscription|undefined;
  private readonly cookieExchangeDisposable: Subscription|undefined;

  showLoginButton = false;
  showLogoutButton = false;

  constructor(
    public readonly auth: AngularFireAuth,
    @Inject(PLATFORM_ID) platformId: object,
    cookies: CookieService,
  ) {

    if (!isPlatformServer(platformId)) {


      this.userDisposable = auth.authState.pipe(
        trace('auth'),
        map(u => !!u)
      ).subscribe(isLoggedIn => {
        this.showLoginButton = !isLoggedIn;
        this.showLogoutButton = isLoggedIn;
      });

      this.cookieExchangeDisposable = auth.credential.pipe(
        filter(it => !!it),
        tap(it => console.log(it.credential)),
      ).subscribe(userCredential => {
        const json = userCredential.credential.toJSON() as any;
        json._uid = userCredential.user.uid;
        cookies.set('session', JSON.stringify(json));
      });

      auth.user.pipe(
        pairwise(),
        filter(([a, b]) => !!a && !b)
      ).subscribe(() => {
        cookies.delete('session');
      });

      auth.getRedirectResult().then(it => console.log('redirectResult', it));
      auth.credential.subscribe(it => console.log('credential', it));

    }
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    if (this.userDisposable) {
      this.userDisposable.unsubscribe();
    }
    if (this.cookieExchangeDisposable) {
      this.cookieExchangeDisposable.unsubscribe();
    }
  }

  async login() {
    const user = await this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  async loginAnonymously() {
    const user = await this.auth.signInAnonymously();
  }

  logout() {
    this.auth.signOut();
  }

}
