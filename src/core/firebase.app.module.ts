import { InjectionToken, NgZone, NgModule, Optional } from '@angular/core';

import { FirebaseOptionsToken, FirebaseNameOrConfigToken } from './angularfire2';

import firebase from '@firebase/app';
import { FirebaseApp as _FirebaseApp, FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';
import { FirebaseAuth } from '@firebase/auth-types';
import { FirebaseDatabase } from '@firebase/database-types';
import { FirebaseMessaging } from '@firebase/messaging-types';
import { FirebaseStorage } from '@firebase/storage-types';
import { FirebaseFirestore } from '@firebase/firestore-types';

export class FirebaseApp implements _FirebaseApp {
    name: string;
    automaticDataCollectionEnabled: boolean;
    options: {};
    auth: () => FirebaseAuth;
    database: (databaseURL?: string) => FirebaseDatabase;
    messaging: () => FirebaseMessaging;
    storage: (storageBucket?: string) => FirebaseStorage;
    delete: () => Promise<void>;
    firestore: () => FirebaseFirestore;
}

export function _firebaseAppFactory(options: FirebaseOptions, nameOrConfig?: string | FirebaseAppConfig) {
    const name = typeof nameOrConfig === 'string' && nameOrConfig || '[DEFAULT]';
    const config = typeof nameOrConfig === 'object' && nameOrConfig || {};
    config.name = config.name || name;
    const existingApp = firebase.apps.filter(app => app.name === config.name)[0];
    return (existingApp || firebase.initializeApp(options, config)) as FirebaseApp;
}

const FirebaseAppProvider = {
    provide: FirebaseApp,
    useFactory: _firebaseAppFactory,
    deps: [
        FirebaseOptionsToken,
        [new Optional(), FirebaseNameOrConfigToken]
    ]
};
 
@NgModule({
    providers: [ FirebaseAppProvider ],
})
export class AngularFireModule {
    static initializeApp(options: FirebaseOptions, nameOrConfig?: string | FirebaseAppConfig) {
        return {
            ngModule: AngularFireModule,
            providers: [
                { provide: FirebaseOptionsToken, useValue: options },
                { provide: FirebaseNameOrConfigToken, useValue: nameOrConfig }
            ]
        }
    }
}