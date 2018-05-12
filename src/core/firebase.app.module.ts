import { InjectionToken, NgZone, NgModule } from '@angular/core';
import { FirebaseOptionsToken, FirebaseAppNameToken, FirebaseAppConfigToken } from './angularfire2';
import firebase from '@firebase/app';
import { FirebaseApp as _FirebaseApp, FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';

export class FirebaseApp extends _FirebaseApp { }

export function _firebaseAppFactory(options: FirebaseOptions, name?: string, appConfig?: FirebaseAppConfig): FirebaseApp {
    const config = appConfig || {};
    if (name && config.name && config.name !== name) {
        console.warn('FirebaseAppNameToken and FirebaseAppConfigToken.name don\'t match, FirebaseAppNameToken takes precedence.');
    }
    config.name = name || config.name || '[DEFAULT]';
    const existingApp = firebase.apps.filter(app => app.name === config.name)[0];
    return (existingApp || firebase.initializeApp(options, config)) as FirebaseApp;
}

const FirebaseAppProvider = {
    provide: FirebaseApp,
    useFactory: _firebaseAppFactory,
    deps: [ FirebaseOptionsToken, FirebaseAppNameToken, FirebaseAppConfigToken ]
};
 
@NgModule({
    providers: [ FirebaseAppProvider ],
})
export class AngularFireModule {
    static initializeApp(options: FirebaseOptions, appNameOrConfig?: string | FirebaseAppConfig) {
        const name   = typeof appNameOrConfig === 'string' && appNameOrConfig || undefined
        const config = typeof appNameOrConfig === 'object' && appNameOrConfig || undefined
        return {
            ngModule: AngularFireModule,
            providers: [
                { provide: FirebaseOptionsToken,   useValue: options },
                { provide: FirebaseAppNameToken,   useValue: name    },
                { provide: FirebaseAppConfigToken, useValue: config  }
            ]
        }
    }
}