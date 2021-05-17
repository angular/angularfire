import { Inject, Injectable, InjectionToken, NgModule, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { FirebaseOptions } from 'firebase/app';
import { USE_EMULATOR } from '@angular/fire/compat/firestore';
import { AngularFirestore, SETTINGS, Settings } from '@angular/fire/compat/firestore';
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/compat/auth';

export const FIRESTORE_OFFLINE = new InjectionToken<AngularFirestore>('my.firestore');

@Injectable()
export class AngularFirestoreOffline extends AngularFirestore {
    constructor(
        @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
        @Optional() @Inject(SETTINGS) settings: Settings | null,
        // tslint:disable-next-line:ban-types
        @Inject(PLATFORM_ID) platformId: Object,
        zone: NgZone,
        @Optional() @Inject(USE_EMULATOR) useEmulator: any,
      ) {
        super(options, 'offline', true, settings, platformId, zone, { synchronizeTabs: true }, useEmulator);
      }
}

@NgModule({
    providers: [ AngularFirestoreOffline ]
}) export class FirestoreOfflineModule {

}
