import { Inject, Injectable, InjectionToken, NgModule, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { FirebaseOptions, FIREBASE_OPTIONS } from '@angular/fire';
import { USE_EMULATOR } from '@angular/fire/firestore';
import { AngularFirestore, SETTINGS, Settings } from '@angular/fire/firestore';
import { USE_EMULATOR as USE_AUTH_EMULATOR, AngularFireAuth } from '@angular/fire/auth';
import { credential } from 'firebase-admin';

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
        @Optional() @Inject(USE_AUTH_EMULATOR) useAuthEmulator: any,
        afAuth: AngularFireAuth,
      ) {
        super(options, 'offline', true, settings, platformId, zone, { synchronizeTabs: true }, useEmulator, useAuthEmulator);
        afAuth.credential.subscribe(userCredential => {
          const auth = this.firestore.app.auth();
          if (userCredential) {
            auth.signInWithCredential(userCredential.credential);
          } else {
            auth.signOut();
          }
        });
      }
}

@NgModule({
    providers: [ AngularFirestoreOffline ]
}) export class FirestoreOfflineModule {

}
