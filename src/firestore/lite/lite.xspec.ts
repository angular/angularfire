import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { Firestore, provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore/lite';
import { COMMON_CONFIG } from '../../test-config';
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
            imports: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideFirestore(() => {
                    providedFirestore = getFirestore(getApp(appName));
                    connectFirestoreEmulator(providedFirestore, 'localhost', 8080);
                    return provideFirestore;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        firestore = TestBed.inject(Firestore);
    });

    afterEach(() => {
        deleteApp(app).catch(() => undefined);
    });

    it('should be injectable', () => {
        expect(firestore).toBeTruthy();
        expect(firestore).toEqual(providedFirestore);
        expect(firestore.app).toEqual(app);
    });

  });

});
