import { InjectionToken, NgZone, NgModule } from '@angular/core';
import { FirebaseApp, FirebaseOptions } from '@firebase/app-types';

import { _firebaseAppFactory, FirebaseAppConfig, FirebaseAppName } from './angularfire2';

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