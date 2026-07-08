import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Firestore, connectFirestoreEmulator, getFirestore, provideFirestore } from '@angular/fire/firestore/lite';
import { COMMON_CONFIG, firestoreEmulatorPort } from '../../test-config';
import { rando } from '../../utils';

describe('Firestore-lite', () => {
  let app: FirebaseApp;
  let firestore: Firestore;
  let providedFirestore: Firestore;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideFirestore(() => {
                    providedFirestore = getFirestore(getApp(appName));
                    connectFirestoreEmulator(providedFirestore, 'localhost', firestoreEmulatorPort);
                    return providedFirestore;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        firestore = TestBed.inject(Firestore);
    });

    it('should be injectable', () => {
        expect(providedFirestore).toBeTruthy();
        expect(firestore).toEqual(providedFirestore);
        expect(firestore.app).toEqual(app);
    });

  });

});
