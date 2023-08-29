import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Firestore, connectFirestoreEmulator, disableNetwork, getFirestore, provideFirestore } from '@angular/fire/firestore';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('Firestore', () => {
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
                    connectFirestoreEmulator(providedFirestore, 'localhost', 8089);
                    return providedFirestore;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        firestore = TestBed.inject(Firestore);
    });

    afterEach(async () => {
      await disableNetwork(firestore);
    });

    it('should be injectable', () => {
        expect(providedFirestore).toBeTruthy();
        expect(firestore).toEqual(providedFirestore);
        expect(firestore.app).toEqual(app);
    });

  });

});
