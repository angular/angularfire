import { InjectionToken, NgModule, Optional, VERSION as NG_VERSION } from '@angular/core';
import { auth, database, firestore, functions, messaging, storage } from 'firebase/app';
// @ts-ignore (https://github.com/firebase/firebase-js-sdk/pull/1206)
import firebase from 'firebase/app'; // once fixed can pull in as "default as firebase" above

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

// Have to implement as we need to return a class from the provider, we should consider exporting
// this in the firebase/app types as this is our highest risk of breaks
export class FirebaseApp {
    name: string;
    options: {};
    auth: () => FirebaseAuth;
    database: (databaseURL?: string) => FirebaseDatabase;
    messaging: () => FirebaseMessaging;
    performance: () => any; // SEMVER: once >= 6 import performance.Performance
    storage: (storageBucket?: string) => FirebaseStorage;
    delete: () => Promise<void>;
    firestore: () => FirebaseFirestore;
    functions: (region?: string) => FirebaseFunctions;
    registerLibrary: (library: string, version: string) => void;
}

export const VERSION = { major: 0, minor: 0, patch: 0, full: '0.0.0' };

export function _firebaseAppFactory(options: FirebaseOptions, nameOrConfig?: string|FirebaseAppConfig|null) {
    const name = typeof nameOrConfig === 'string' && nameOrConfig || '[DEFAULT]';
    const config = typeof nameOrConfig === 'object' && nameOrConfig || {};
    config.name = config.name || name;
    // Added any due to some inconsistency between @firebase/app and firebase types
    const existingApp = firebase.apps.filter(app => app && app.name === config.name)[0] as any;
    // We support FirebaseConfig, initializeApp's public type only accepts string; need to cast as any
    // Could be solved with https://github.com/firebase/firebase-js-sdk/pull/1206
    const app = (existingApp || firebase.initializeApp(options, config as any)) as FirebaseApp;
    app.registerLibrary('angular-fire', VERSION.full);
    app.registerLibrary('angular-core', NG_VERSION.full);
    return app;
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