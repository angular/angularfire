import { Component, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { Auth, authState, signInAnonymously, signOut, User } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-auth',
  template: `
    <p>
      Auth!
      {{ (user | async)?.uid | json }}
      <button (click)="login()" *ngIf="showLoginButton">Log in with Google</button>
      <button (click)="loginAnonymously()" *ngIf="showLoginButton">Log in anonymously</button>
      <button (click)="logout()" *ngIf="showLogoutButton">Log out</button>
    </p>
  `,
  styles: []
})
export class AuthComponent implements OnInit, OnDestroy {

  private readonly userDisposable: Subscription|undefined;
  public readonly user: Observable<User | null>;

  showLoginButton = false;
  showLogoutButton = false;

  constructor(public readonly auth: Auth, @Inject(PLATFORM_ID) platformId: object) {
    this.user = authState(this.auth);
    this.userDisposable = authState(this.auth).pipe(
      traceUntilFirst('auth'),
      map(u => !!u)
    ).subscribe(isLoggedIn => {
      this.showLoginButton = !isLoggedIn;
      this.showLogoutButton = isLoggedIn;
    });
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    if (this.userDisposable) {
      this.userDisposable.unsubscribe();
    }
  }

  async login() {
    const { GoogleAuthProvider, signInWithPopup } = await import('./GoogleAuthProvider');
    return await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async loginAnonymously() {
    return await signInAnonymously(this.auth);
  }

  async logout() {
    return await signOut(this.auth);
  }

}
