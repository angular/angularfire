import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Storage, connectStorageEmulator, getStorage, provideStorage } from '@angular/fire/storage';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('Storage', () => {
  let app: FirebaseApp;
  let storage: Storage;
  let providedStorage: Storage;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideStorage(() => {
                    providedStorage = getStorage(getApp(appName));
                    connectStorageEmulator(providedStorage, 'localhost', 9199);
                    return providedStorage;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        storage = TestBed.inject(Storage);
    });

    it('should be injectable', () => {
        expect(providedStorage).toBeTruthy();
        expect(storage).toEqual(providedStorage);
        expect(storage.app).toEqual(app);
    });

  });

});
