import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { trace } from '@angular/fire/performance';
import { FirebaseApp } from '@angular/fire';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-auth',
  template: `
    <p>
      Auth!
      {{ (auth.user | async)?.uid | json }}
      {{ (auth.credential | async) | json }}
      <button (click)="login()" *ngIf="showLoginButton">Log in with Google</button>
      <button (click)="loginAnonymously()" *ngIf="showLoginButton">Log in anonymously</button>
      <button (click)="logout()" *ngIf="showLogoutButton">Log out</button>
    </p>
  `,
  styles: []
})
export class AuthComponent implements OnInit, OnDestroy {

  private readonly userDisposable: Subscription|undefined;

  showLoginButton = false;
  showLogoutButton = false;

  // tslint:disable-next-line:ban-types
  constructor(public readonly app: FirebaseApp, public readonly auth: AngularFireAuth, @Inject(PLATFORM_ID) platformId: Object) {

    if (isPlatformBrowser(platformId)) {
      this.userDisposable = auth.authState.pipe(
        trace('auth'),
        map(u => !!u)
      ).subscribe(isLoggedIn => {
        this.showLoginButton = !isLoggedIn;
        this.showLogoutButton = isLoggedIn;
      });
    }
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    if (this.userDisposable) {
      this.userDisposable.unsubscribe();
    }
  }

  async login() {
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('./signInWithGoogle');
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(getAuth(this.app), provider);
  }

  async loginAnonymously() {
    const { getAuth, signInAnonymously } = await import('./signInAnonymously');
    return await signInAnonymously(getAuth(this.app));
  }

  async logout() {
    const { getAuth, signOut } = await import('./signOut');
    return await signOut(getAuth(this.app));
  }

}
