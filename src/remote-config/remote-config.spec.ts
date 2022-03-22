import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { RemoteConfig, provideRemoteConfig, getRemoteConfig, isSupported } from '@angular/fire/remote-config';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('RemoteConfig', () => {
  let app: FirebaseApp;
  let remoteConfig: RemoteConfig;
  let providedRemoteConfig: RemoteConfig;
  let appName: string;

  beforeAll(done => {
    // The APP_INITIALIZER that is making isSupported() sync for DI may not
    // be done evaulating by the time we inject from the TestBed. We can
    // ensure correct behavior by waiting for the (global) isSuppported() promise
    // to resolve.
    isSupported().then(() => done());
  });

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            imports: [
                provideFirebaseApp(() => initializeApp(COMMON_CONFIG, appName)),
                provideRemoteConfig(() => {
                    providedRemoteConfig = getRemoteConfig(getApp(appName));
                    return providedRemoteConfig;
                }),
            ],
        });
        app = TestBed.inject(FirebaseApp);
        remoteConfig = TestBed.inject(RemoteConfig);
    });

    it('should be injectable', () => {
        expect(providedRemoteConfig).toBeTruthy();
        expect(remoteConfig).toEqual(providedRemoteConfig);
        expect(remoteConfig.app).toEqual(app);
    });

  });

});
