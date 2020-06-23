import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth as rawAuth } from 'firebase/app';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { trace } from '@angular/fire/performance';

@Component({
  selector: 'app-auth',
  template: `
    <p>
      Auth!
      {{ (auth.user | async)?.uid | json }}
      <button (click)="login()" *ngIf="showLoginButton">Log in with Google</button>
      <button (click)="logout()" *ngIf="showLogoutButton">Log out</button>
    </p>
  `,
  styles: []
})
export class AuthComponent implements OnInit, OnDestroy {

  private readonly userDisposable: Subscription;

  showLoginButton = false;
  showLogoutButton = false;

  constructor(public readonly auth: AngularFireAuth) {
    this.userDisposable = this.auth.authState.pipe(
      trace('auth'),
      map(u => !!u)
    ).subscribe(isLoggedIn => {
      this.showLoginButton = !isLoggedIn;
      this.showLogoutButton = isLoggedIn;
    });
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.userDisposable.unsubscribe();
  }

  login() {
    this.auth.signInWithPopup(new rawAuth.GoogleAuthProvider());
  }

  logout() {
    this.auth.signOut();
  }

}
