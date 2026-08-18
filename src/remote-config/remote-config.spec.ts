import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { RemoteConfig, getRemoteConfig, provideRemoteConfig } from '@angular/fire/remote-config';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';

describe('RemoteConfig', () => {
  let app: FirebaseApp;
  let remoteConfig: RemoteConfig;
  let providedRemoteConfig: RemoteConfig;
  let appName: string;

  describe('single injection', () => {

    beforeEach(() => {
        appName = rando();
        TestBed.configureTestingModule({
            providers: [
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
