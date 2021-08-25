import { Inject, Injectable, InjectionToken, NgModule, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { FirebaseOptions } from 'firebase/app';
import { USE_EMULATOR } from '@angular/fire/compat/firestore';
import { AngularFirestore, SETTINGS, Settings } from '@angular/fire/compat/firestore';
import { ɵAngularFireSchedulers } from '@angular/fire';
import {
  AngularFireAuth,
  USE_EMULATOR as USE_AUTH_EMULATOR,
  SETTINGS as AUTH_SETTINGS,
  TENANT_ID,
  LANGUAGE_CODE,
  USE_DEVICE_LANGUAGE,
  PERSISTENCE,
} from '@angular/fire/compat/auth';

export const FIRESTORE_OFFLINE = new InjectionToken<AngularFirestore>('my.firestore');

@Injectable()
export class AngularFirestoreOffline extends AngularFirestore {
    constructor(
        @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
        @Optional() @Inject(SETTINGS) settings: Settings | null,
        // tslint:disable-next-line:ban-types
        @Inject(PLATFORM_ID) platformId: Object,
        zone: NgZone,
        schedulers: ɵAngularFireSchedulers,
        @Optional() @Inject(USE_EMULATOR) useEmulator: any,
        @Optional() auth: AngularFireAuth,
        @Optional() @Inject(USE_AUTH_EMULATOR) useAuthEmulator: any,
        @Optional() @Inject(AUTH_SETTINGS) authSettings: any, // can't use firebase.auth.AuthSettings here
        @Optional() @Inject(TENANT_ID) tenantId: string | null,
        @Optional() @Inject(LANGUAGE_CODE) languageCode: string | null,
        @Optional() @Inject(USE_DEVICE_LANGUAGE) useDeviceLanguage: boolean | null,
        @Optional() @Inject(PERSISTENCE) persistence: string | null,
      ) {
        super(
          options, 'offline', true, settings, platformId, zone, schedulers, { synchronizeTabs: true }, useEmulator,
          auth, useAuthEmulator, authSettings, tenantId, languageCode, useDeviceLanguage, persistence
        );
      }
}

@NgModule({
    providers: [ AngularFirestoreOffline ]
}) export class FirestoreOfflineModule {

}
