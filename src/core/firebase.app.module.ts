import { InjectionToken, NgZone, NgModule } from '@angular/core';

import { FirebaseAppConfig, FirebaseAppName } from './angularfire2';

import firebase from '@firebase/app';
import { FirebaseApp as _FirebaseApp, FirebaseOptions } from '@firebase/app-types';

export class FirebaseApp extends _FirebaseApp { }

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
                { provide: FirebaseAppName, useValue: appName }
            ]
        }
    }
}
