import { InjectionToken, } from '@angular/core';
import { FirebaseAppConfig } from './';
import { firebase } from '@firebase/app';

import { FirebaseApp as FBApp } from '@firebase/app-types';
import { FirebaseAuth } from '@firebase/auth-types';
import { FirebaseDatabase } from '@firebase/database-types';
import { FirebaseMessaging } from '@firebase/messaging-types';
import { FirebaseStorage } from '@firebase/storage-types';
import { FirebaseFirestore } from '@firebase/firestore-types';

export const FirebaseAppConfigToken = new InjectionToken<FirebaseAppConfig>('FirebaseAppConfigToken');

export class FirebaseApp implements FBApp {
  name: string;
  options: {};
  auth: () => FirebaseAuth;
  database: () => FirebaseDatabase;
  messaging: () => FirebaseMessaging;
  storage: () => FirebaseStorage;
  delete: () => Promise<any>;
  firestore: () => FirebaseFirestore;
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
