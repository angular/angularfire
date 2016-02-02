import {Provider, Inject} from 'angular2/core';
import {ReplaySubject} from 'rxjs/subject/ReplaySubject';
import {FirebaseRef} from '../tokens';

import * as Firebase from 'firebase';

const kBufferSize = 1; 

export enum AuthProviders {
  Github
};

export class FirebaseAuth extends ReplaySubject<FirebaseAuthState> {
  constructor (@Inject(FirebaseRef) private _fbRef: Firebase) {
    super (kBufferSize);

    this._fbRef.onAuth((authData) => this._emitAuthData(authData));
  }

  private _emitAuthData(authData: FirebaseAuthDataAllProviders): void {
    if (authData == null) {
      this.next(null);
    } else {
      let {uid, provider, github} = authData;
      let authState: FirebaseAuthState = {uid, provider: null};
      switch (provider) {
        case "github":
          authState.github = github;
          authState.provider = AuthProviders.Github;
          break;
        default:
          throw new Error(`Unsupported firebase auth provider ${provider}`);
      }
      this.next(authState);
    }
  }
}

export interface FirebaseAuthState {
  uid: string;
  provider: AuthProviders;
  github?: FirebaseAuthDataGithub;
}

export interface FirebaseAuthDataGithub {
  id: string;
  username: string;
  accessToken: string;
  displayName?: string;
  scope?: [string];
}

// Firebase only provides typings for 
interface FirebaseAuthDataAllProviders extends FirebaseAuthData {
  github?: FirebaseAuthDataGithub;
}
