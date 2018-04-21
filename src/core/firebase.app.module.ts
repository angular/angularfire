import { InjectionToken, NgZone, NgModule } from '@angular/core';

import { FirebaseAppConfig, FirebaseAppName, UniversalDatabaseTransferStateKeyPrefix } from './angularfire2';

import firebase from '@firebase/app';
import { FirebaseApp as _FirebaseApp, FirebaseOptions } from '@firebase/app-types';
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

export function _firebaseAppFactory(config: FirebaseOptions, name?: string): FirebaseApp {
    const appName = name || '[DEFAULT]';
    const existingApp = firebase.apps.filter(app => app.name == appName)[0] as FirebaseApp;
    return existingApp || firebase.initializeApp(config, appName) as FirebaseApp;
}

const FirebaseAppProvider = {
    provide: FirebaseApp,
    useFactory: _firebaseAppFactory,
    deps: [ FirebaseAppConfig, FirebaseAppName ]
};
 
@NgModule({
    providers: [ FirebaseAppProvider ],
})
export class AngularFireModule {
    static initializeApp(config: FirebaseOptions, appName?: string) {
        return {
            ngModule: AngularFireModule,
            providers: [
                { provide: FirebaseAppConfig, useValue: config },
                { provide: FirebaseAppName, useValue: appName },
                { provide: UniversalDatabaseTransferStateKeyPrefix, useValue: 'RTDB' }
            ]
        }
    }
}
