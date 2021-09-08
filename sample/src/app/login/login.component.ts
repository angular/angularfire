import { Component, OnInit } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signInAnonymously } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
    <p>
      <button (click)="loginWithGoogle()">Log in with Google</button>
      <button (click)="loginAnonymously()">Log in with Anonymously</button>
    </p>
  `,
  styles: [
  ]
})
export class LoginComponent implements OnInit {

  redirect = ['/'];

  constructor(private auth: Auth, private router: Router) {
  }

  ngOnInit(): void {
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
    await this.router.navigate(this.redirect);
  }

  async loginAnonymously() {
    await signInAnonymously(this.auth);
    await this.router.navigate(this.redirect);
  }

}
