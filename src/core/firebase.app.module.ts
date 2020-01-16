import { InjectionToken, NgModule, Optional, NgZone } from '@angular/core';
import { app, auth, database, messaging, storage, firestore, functions, analytics, performance, remoteConfig } from 'firebase/app';

// @ts-ignore (https://github.com/firebase/firebase-js-sdk/pull/1206)
import firebase from 'firebase/app'; // once fixed can pull in as "default as firebase" above

// INVESTIGATE Public types don't expose FirebaseOptions or FirebaseAppConfig, is this the case anylonger?
export interface FirebaseOptions {[key:string]: any};
export interface FirebaseAppConfig {[key:string]: any};

export const FIREBASE_OPTIONS = new InjectionToken<FirebaseOptions>('angularfire2.app.options');
export const FIREBASE_APP_NAME = new InjectionToken<string|FirebaseAppConfig|undefined>('angularfire2.app.nameOrConfig');

// Have to implement as we need to return a class from the provider, we should consider exporting
// this in the firebase/app types as this is our highest risk of breaks
export class FirebaseApp implements Partial<app.App> {
    name: string;
    options: {};
    analytics: () => analytics.Analytics;
    auth: () => auth.Auth;
    database: (databaseURL?: string) => database.Database;
    messaging: () => messaging.Messaging;
    performance: () => performance.Performance;
    storage: (storageBucket?: string) => storage.Storage;
    delete: () => Promise<void>;
    firestore: () => firestore.Firestore;
    functions: (region?: string) => functions.Functions;
    remoteConfig: () => remoteConfig.RemoteConfig;
}

export function ɵfirebaseAppFactory(options: FirebaseOptions, zone: NgZone, nameOrConfig?: string|FirebaseAppConfig|null) {
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
    useFactory: ɵfirebaseAppFactory,
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