import { InjectionToken, NgModule, Optional, NgZone } from '@angular/core';
import { auth, database, messaging, storage, firestore, functions } from 'firebase/app';
// @ts-ignore (https://github.com/firebase/firebase-js-sdk/pull/1206)
import firebase from 'firebase/app'; // once fixed can pull in as "default as firebase" above

// Public types don't expose FirebaseOptions or FirebaseAppConfig
export type FirebaseOptions = {[key:string]: any};
export type FirebaseAppConfig = {[key:string]: any};

// SEMVER drop FirebaseOptionsToken and FirebaseNameOrConfigToken in favor of FIREBASE_OPTIONS and FIREBASE_APP_NAME in next major
export const FirebaseOptionsToken = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FirebaseNameOrConfigToken = new InjectionToken<string|FirebaseAppConfig|undefined>('angularfire2.app.nameOrConfig');

export const FIREBASE_OPTIONS = FirebaseOptionsToken;
export const FIREBASE_APP_NAME = FirebaseNameOrConfigToken;

export type FirebaseDatabase = database.Database;
export type FirebaseAuth = auth.Auth;
// SEMVER analytics.Analytics;
export type FirebaseAnalytics = any;
export type FirebaseMessaging = messaging.Messaging;
// SEMVER performance.Performance
export type FirebasePerformance = any;
export type FirebaseStorage = storage.Storage;
export type FirebaseFirestore = firestore.Firestore;
export type FirebaseFunctions = functions.Functions;
// SEMVER remoteConfig.RemoteConfig;
export type FirebaseRemoteConfig = any;

// Have to implement as we need to return a class from the provider, we should consider exporting
// this in the firebase/app types as this is our highest risk of breaks
export class FirebaseApp {
    name: string;
    options: {};
    analytics: () => FirebaseAnalytics;
    auth: () => FirebaseAuth;
    database: (databaseURL?: string) => FirebaseDatabase;
    messaging: () => FirebaseMessaging;
    performance: () => FirebasePerformance;
    storage: (storageBucket?: string) => FirebaseStorage;
    delete: () => Promise<void>;
    firestore: () => FirebaseFirestore;
    functions: (region?: string) => FirebaseFunctions;
    remoteConfig: () => FirebaseRemoteConfig;
}

export function _firebaseAppFactory(options: FirebaseOptions, zone: NgZone, nameOrConfig?: string|FirebaseAppConfig|null) {
    const name = typeof nameOrConfig === 'string' && nameOrConfig || '[DEFAULT]';
    const config = typeof nameOrConfig === 'object' && nameOrConfig || {};
    config.name = config.name || name;
    // Added any due to some inconsistency between @firebase/app and firebase types
    const existingApp = firebase.apps.filter(app => app && app.name === config.name)[0] as any;
    // We support FirebaseConfig, initializeApp's public type only accepts string; need to cast as any
    // Could be solved with https://github.com/firebase/firebase-js-sdk/pull/1206
    return (existingApp || zone.runOutsideAngular(() => firebase.initializeApp(options, config as any))) as FirebaseApp;
}

const FirebaseAppProvider = {
    provide: FirebaseApp,
    useFactory: _firebaseAppFactory,
    deps: [
        FIREBASE_OPTIONS,
        NgZone,
        [new Optional(), FIREBASE_APP_NAME]
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
                { provide: FIREBASE_OPTIONS, useValue: options },
                { provide: FIREBASE_APP_NAME, useValue: nameOrConfig }
            ]
        }
    }
}