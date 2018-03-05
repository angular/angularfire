import { COMMON_CONFIG } from './test-config';
import { FirebaseApp as FBApp } from '@firebase/app-types';
import { Observable } from 'rxjs/Observable'
import { forkJoin } from 'rxjs/observable/forkJoin';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireMessaging, AngularFireMessagingModule } from 'angularfire2/messaging';

fdescribe('AngularFireMessaging', () => {
  let app: FBApp;
  let afMessaging: AngularFireMessaging;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireMessagingModule
      ]
    });
    inject([FirebaseApp, AngularFireMessaging], (app_: FirebaseApp, _messaging: AngularFireMessaging) => {
      app = app_;
      afMessaging = _messaging;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  it('should exist', () => {
    expect(afMessaging instanceof AngularFireMessaging).toBe(true);
  });

  it('should have the Firebase messaging instance', () => {
    expect(afMessaging.messaging).toBeDefined();
  });

});
