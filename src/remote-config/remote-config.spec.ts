import { TestBed } from '@angular/core/testing';
import { FirebaseApp, provideFirebaseApp, getApp, initializeApp, deleteApp } from '@angular/fire/app';
import { RemoteConfig, provideRemoteConfig, getRemoteConfig } from '@angular/fire/remote-config';
import { COMMON_CONFIG } from '../test-config';
import { rando } from '../utils';
import { isSupportedValueSymbol } from './remote-config.module';

globalThis[isSupportedValueSymbol] = true;

describe('RemoteConfig', () => {
  let app: FirebaseApp;
  let remoteConfig: RemoteConfig;
  let providedRemoteConfig: RemoteConfig;
  let appName: string;

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

    afterEach(() => {
        deleteApp(app).catch(() => undefined);
    });

    it('should be injectable', () => {
        expect(providedRemoteConfig).toBeTruthy();
        expect(remoteConfig).toEqual(providedRemoteConfig);
        expect(remoteConfig.app).toEqual(app);
    });

  });

});
