import { InjectionToken, } from '@angular/core';
import { FirebaseAppConfig } from './';
import * as firebase from 'firebase/app';
// TODO(davideast): Replace once Firestore is merged in firebase.d.ts
import { Firestore } from 'firestore';

export const FirebaseAppConfigToken = new InjectionToken<FirebaseAppConfig>('FirebaseAppConfigToken');

export class FirebaseApp implements firebase.app.App {
  name: string;
  options: {};
  auth: () => firebase.auth.Auth;
  database: () => firebase.database.Database;
  messaging: () => firebase.messaging.Messaging;
  storage: () => firebase.storage.Storage;
  delete: () => firebase.Promise<any>;
  firestore: () => Firestore;
}

export function _firebaseAppFactory(config: FirebaseAppConfig, appName?: string): FirebaseApp {
  try {
    if (appName) {
      return firebase.initializeApp(config, appName) as FirebaseApp;
    } else {
      return firebase.initializeApp(config) as FirebaseApp;
    }
  }
  catch (e) {
    if (e.code === "app/duplicate-app") {
      return firebase.app(e.name) as FirebaseApp;
    }

    return firebase.app(null!) as FirebaseApp;
  }
}
