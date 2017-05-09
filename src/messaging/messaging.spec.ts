import * as firebase from 'firebase/app';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from '../angularfire2';
import { AngularFireMessaging } from './messaging';
import { AngularFireMessagingModule } from './messaging.module';
import { COMMON_CONFIG } from '../test-config';


describe('AngularFireStorage', () => {
  let app: firebase.app.App;
  let messaging: AngularFireMessaging;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireMessagingModule
      ]
    });
    inject([FirebaseApp, AngularFireMessaging], (app_: FirebaseApp, _messaging: AngularFireMessaging) => {
      app = app_;
      messaging = _messaging;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  it('should be exist', () => {
    expect(messaging instanceof AngularFireMessaging).toBe(true);
  });

  it('should have the Firebase Auth instance', () => {
    expect(messaging.messaging).toBeDefined();
  });

});

