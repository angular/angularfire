import { StorageService as FirebaseStorage } from 'firebase/storage';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Storage extends FirebaseStorage {}

export class Storage {
  constructor(auth: FirebaseStorage) {
    return auth;
  }
}
