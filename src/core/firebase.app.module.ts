import { InjectionToken, NgModule, Optional } from '@angular/core';
import { auth, database, firestore, functions, messaging, storage } from 'firebase/app';
// @ts-ignore (https://github.com/firebase/firebase-js-sdk/pull/1206)
import firebase from 'firebase/app'; // once fixed can pull in as "default as firebase" above

// Public types don't expose FirebaseOptions or FirebaseAppConfig
export type FirebaseOptions = {[key:string]: any};
export type FirebaseAppConfig = {[key:string]: any};

export const FirebaseOptionsToken = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FirebaseNameOrConfigToken = new InjectionToken<string|FirebaseAppConfig|undefined>('angularfire2.app.nameOrConfig');
export const InitializeAsTestApp = new InjectionToken<boolean>('angularfire2.app.test');

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
    installations: () => any; // SEMVER: drop once we can target
}

export function _firebaseAppFactory(options: FirebaseOptions, nameOrConfig?: string|FirebaseAppConfig|null, initializeAsTestApp?: boolean|null) {
    // Added any due to some inconsistency between @firebase/app and firebase types
    if (typeof window === 'undefined' && initializeAsTestApp) {
        // @ts-ignore
        return FirebaseTesting.initializeTestApp(options) as FirebaseApp;
    } else {
        const name = typeof nameOrConfig === 'string' && nameOrConfig || '[DEFAULT]';
        const config = typeof nameOrConfig === 'object' && nameOrConfig || {};
        config.name = config.name || name;    
        const existingApp = <any>firebase.apps.filter(app => app && app.name === config.name)[0];
        // We support FirebaseConfig, initializeApp's public type only accepts string; need to cast as any
        // Could be solved with https://github.com/firebase/firebase-js-sdk/pull/1206
        return (existingApp || <any>firebase.initializeApp(options, config as any)) as FirebaseApp;
    }
}

const FirebaseAppProvider = {
    provide: FirebaseApp,
    useFactory: _firebaseAppFactory,
    deps: [
        FirebaseOptionsToken,
        [new Optional(), FirebaseNameOrConfigToken],
        [new Optional(), InitializeAsTestApp]
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
                { provide: FirebaseNameOrConfigToken, useValue: nameOrConfig },
                { provide: InitializeAsTestApp, useValue: false }
            ]
        }
    }
    static initializeTestApp(options: FirebaseOptions, nameOrConfig?: string | FirebaseAppConfig) {
        return {
            ngModule: AngularFireModule,
            providers: [
                { provide: FirebaseOptionsToken, useValue: options },
                { provide: FirebaseNameOrConfigToken, useValue: nameOrConfig },
                { provide: InitializeAsTestApp, useValue: true }
            ]
        }
    }
}