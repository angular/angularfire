import {Component, enableProdMode, Inject, provide} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {
  AuthMethods,
  AuthProviders,
  defaultFirebase,
  AngularFire,
  FIREBASE_PROVIDERS,
  FirebaseListObservable,
  FirebaseApp
} from '../../../dist/angularfire2';

enableProdMode();

import { COMMON_CONFIG } from '../../../src/test-config';

@Component({
  template: `
    <button id="logout" (click)="af.auth.logout()">Logout</button>
    <br><br>
    <blockquote>
      <h1>Anonymous Login</h1>
      <button id="login-anonymous" (click)="signInAnonymously()">Login Anonymously</button>

      <p>
        Is Anonymous?
        <span id="is-anonymous">
          {{ user?.anonymous }}
        </span>
      </p>
    </blockquote>
    <blockquote class="oauth">
      <h1>OAuth Login</h1>


      <h2>OAuth Provider</h2>
      <select id="authProvider" #authProvider>
        <option selected>Twitter</option>
        <option>Facebook</option>
        <option>Google</option>
        <option>Github</option>
      </select>

      <p>
        <label for="redirect">Redirect?</label>
        <input id="redirect" #redirect type="checkbox">
      </p>

      <p>
        <button (click)="signInWithOAuth(redirect.checked, authProvider.value)">
          Sign In
        </button>
      </p>
    </blockquote>

    <blockquote>
      <h1>Create User</h1>
      <input #createEmail type="email" placeholder="email@email.email">
      <input #createPassword type="password" placeholder="password">
      <button (click)="createUser(createEmail.value, createPassword.value)">Create</button>
    </blockquote>

    <blockquote>
      <h1>Email and Password Login</h1>
      <input #loginEmail type="email" placeholder="email@email.email">
      <input #loginPassword type="password" placeholder="password">
      <button (click)="loginUser(loginEmail.value, loginPassword.value)">Login</button>
    </blockquote>

    <blockquote>
      <h1>Custom Token Login</h1>
      <textarea #customToken type="text" placeholder="token"></textarea>
      <button (click)="signInWithCustomToken(customToken.value)">Login</button>
    </blockquote>

    <hr>

    <blockquote>
      <h2>Provider Data</h2>
      {{ user?.providerData && user.providerData[0] | json }}
      <span *ngIf="!user || !user.providerData">Not Logged In</span>
    </blockquote>
  `,
  selector: 'app'
})
class App {
  user: any;
  questions: FirebaseListObservable<any>;
  constructor(public af: AngularFire) {
    af.auth
      .subscribe(user => {
        console.log('onAuth', user);
        this.user = user
      });
  }

  signInAnonymously() {
    this.af.auth.login({
      method: AuthMethods.Anonymous
    })
      .then((user) => console.log(`Anonymous Login Success:`, user))
      .catch(e => console.error(`Anonymous Login Failure:`, e));
  }

  signInWithOAuth(redirect: boolean, provider: string) {
    this.af.auth.login({
      method: redirect ? AuthMethods.Redirect : AuthMethods.Popup,
      provider: (<any>AuthProviders)[provider]
    })
      .then((user) => console.log(`${provider} Login Success:`, user))
      .catch(e => console.error(`${provider} Login Failure:`, e));
  }

  createUser(email: string, password: string) {
    this.af.auth.createUser({ email, password })
      .then((user) => console.log(`Create User Success:`, user))
      .catch(e => console.error(`Create User Failure:`, e));
  }

  loginUser(email: string, password: string) {
    this.af.auth.login({ email, password }, {
      method: AuthMethods.Password,
      provider: AuthProviders.Password
    })
      .then((user) => console.log(`Password Login Success:`, user))
      .catch(e => console.error(`Password Login Failure:`, e));
  }

  signInWithCustomToken(token: string) {
    // TODO: this.af.auth.login({ token });
  }
}

bootstrap(App, [
  FIREBASE_PROVIDERS,
  defaultFirebase(COMMON_CONFIG)]).then(() => {
    console.log('bootstrap success');
  }, (e:any) => {
    console.error('bootstrap failed', e);
  });
