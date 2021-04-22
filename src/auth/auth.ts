import { Auth } from 'firebase/auth';

// tslint:disable-next-line:no-empty-interface
export interface AngularFireAuth extends Auth {}

export class AngularFireAuth {
  constructor(auth: Auth) {
    return auth;
  }
}
