import { Component, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import { Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { trace } from '@angular/fire/performance';
import { Inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';

@Component({
  selector: 'app-auth',
  template: `
    <p>
      Auth!
      {{ (auth.user | async)?.uid | json }}
      {{ (auth.user | async)?.metadata | json }}
      <button (click)="login()" *ngIf="showLoginButton">Log in with Google</button>
      <button (click)="logout()" *ngIf="showLogoutButton">Log out</button>
    </p>
  `,
  styles: []
})
export class AuthComponent implements OnInit, OnDestroy {

  private readonly userDisposable: Subscription|undefined;

  showLoginButton = false;
  showLogoutButton = false;

  constructor(public readonly auth: AngularFireAuth, @Inject(PLATFORM_ID) platformId: object) {
    if (!isPlatformServer(platformId)) {
      this.userDisposable = this.auth.authState.pipe(
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
    const user = await this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    console.log(user?.additionalUserInfo.isNewUser);
    // TODO sign into offline app
  }

  logout() {
    this.auth.signOut();
    // TODO sign out of offline app
  }

}
