import { InjectionToken, NgZone, NgModule, Optional } from '@angular/core';
import { app, auth, database, firestore, functions, messaging, storage } from 'firebase';
import * as firebase from 'firebase/app';

// Public types don't expose FirebaseOptions or FirebaseAppConfig
export type FirebaseOptions = {[key:string]: any};
export type FirebaseAppConfig = {[key:string]: any};

export const FirebaseOptionsToken = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FirebaseNameOrConfigToken = new InjectionToken<string|FirebaseAppConfig|undefined>('angularfire2.app.nameOrConfig')

export type FirebaseDatabase = database.Database;
export type FirebaseAuth = auth.Auth;
export type FirebaseMessaging = messaging.Messaging;
export type FirebaseStorage = storage.Storage;
export type FirebaseFirestore = firestore.Firestore;
export type FirebaseFunctions = functions.Functions;

export class FirebaseApp implements app.App {
    name: string;
    options: {};
    auth: () => FirebaseAuth;
    // app.App database() doesn't take a databaseURL arg in the public types?
    database: (databaseURL?: string) => FirebaseDatabase;
    // automaticDataCollectionEnabled is now private? _automaticDataCollectionEnabled?
    // automaticDataCollectionEnabled: true,
    messaging: () => FirebaseMessaging;
    storage: (storageBucket?: string) => FirebaseStorage;
    delete: () => Promise<void>;
    firestore: () => FirebaseFirestore;
    functions: () => FirebaseFunctions;
}

export function _firebaseAppFactory(options: FirebaseOptions, nameOrConfig?: string | FirebaseAppConfig) {
    const name = typeof nameOrConfig === 'string' && nameOrConfig || '[DEFAULT]';
    const config = typeof nameOrConfig === 'object' && nameOrConfig || {};
    config.name = config.name || name;
    const existingApp = firebase.apps.filter(app => app && app.name === config.name)[0];
    // We support FirebaseConfig, initializeApp's public type only accepts string; need to cast as any
    return (existingApp || firebase.initializeApp(options, <any>config)) as FirebaseApp;
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