import { COMMON_CONFIG } from './test-config';
import { FirebaseApp as FBApp } from '@firebase/app-types';
import { Observable } from 'rxjs/Observable'
import { forkJoin } from 'rxjs/observable/forkJoin';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireMessaging, AngularFireMessagingModule } from 'angularfire2/messaging';
import * as firebase from 'firebase/app';
import 'firebase/messaging';

xdescribe('AngularFireMessaging', () => {
  let app: firebase.app.App;
  let afMessaging: AngularFireMessaging;

  beforeAll((done: any) => {
    navigator.serviceWorker.register('/base/firebase-messaging-sw.js')
    .then((registration) => {
      app = firebase.initializeApp(COMMON_CONFIG, 'SW-REG');
      app.messaging!().useServiceWorker(registration);
      afMessaging = new AngularFireMessaging(app as any);
      done();
    })
    .catch(e => {
      console.error(e);
      done.fail();
    })
  });

  it('should exist', () => {
    expect(afMessaging instanceof AngularFireMessaging).toBe(true);
  });

  it('should have the Firebase messaging instance', () => {
    expect(afMessaging.messaging).toBeDefined();
  });

  it('should get request permission and get a token', (done) => {
    afMessaging.requestToken.subscribe(token => {
      expect(typeof token === 'string').toBe(true);
      done();
    }, done.fail);
  });

  it('should give me a token', (done) => {
    afMessaging.getToken.subscribe(token => {
      expect(typeof token === 'string').toBe(true);
      done();
    }, done.fail);
  });

});
