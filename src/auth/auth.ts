import { Auth as FirebaseAuth } from 'firebase/auth';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Auth extends FirebaseAuth {}

export class Auth {
  constructor(auth: FirebaseAuth) {
    return auth;
  }
}
