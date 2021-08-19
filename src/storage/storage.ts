import { FirebaseStorage } from 'firebase/storage';
import { ɵgetAllInstancesOf } from '@angular/fire';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Storage extends FirebaseStorage {}

export class Storage {
  constructor(auth: FirebaseStorage) {
    return auth;
  }
}

export const STORAGE_PROVIDER_NAME = 'storage-exp';

// tslint:disable-next-line:no-empty-interface
export interface StorageInstances extends Array<FirebaseStorage> {}

export class StorageInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseStorage>(STORAGE_PROVIDER_NAME);
  }
}

export const storageInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseStorage>(STORAGE_PROVIDER_NAME))),
  distinct(),
);
