import * as firebase from 'firebase/app';
import {
  TestBed,
  inject
} from '@angular/core/testing';
import { ReflectiveInjector, Provider } from '@angular/core';
import {
  AngularFire,
  FirebaseObjectObservable,
  FIREBASE_PROVIDERS,
  FirebaseApp,
  AngularFireDatabase,
  FirebaseAppConfig,
  AngularFireModule,
  AngularFireAuth
} from './angularfire2';
import { Subscription } from 'rxjs/Subscription';
import { COMMON_CONFIG, ANON_AUTH_CONFIG } from './test-config';

describe('angularfire', () => {
  let subscription:Subscription;
  let app: FirebaseApp;
  let rootRef: firebase.database.Reference;
  let questionsRef: firebase.database.Reference;
  let listOfQuestionsRef: firebase.database.Reference;
  let angularfire: AngularFire;
  const APP_NAME = 'super-awesome-test-firebase-app-name';

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, ANON_AUTH_CONFIG, APP_NAME)]
    });

    inject([FirebaseApp, AngularFire], (_app: FirebaseApp, _af: AngularFire) => {
      angularfire = _af;
      app = _app;
      rootRef = app.database().ref();
      questionsRef = rootRef.child('questions');
      listOfQuestionsRef = rootRef.child('list-of-questions');
    })();

  });

  afterEach((done) => {
    rootRef.remove()
    if(subscription && !subscription.closed) {
      subscription.unsubscribe();
    }
    app.delete().then(done, done.fail);
  });

  it('should be injectable via FIREBASE_PROVIDERS', () => {
    expect(angularfire instanceof AngularFire).toBe(true);
  });

  describe('.auth', () => {
    it('should be an instance of AuthService', inject([AngularFire], (af:AngularFire) => {
      debugger;
      expect(af.auth instanceof AngularFireAuth).toBe(true);
    }));
  });

  describe('.database', () => {
    it('should be an instance of Database', inject([AngularFire], (af:AngularFire) => {
      expect(af.database instanceof AngularFireDatabase).toBe(true);
    }));
  });

  describe('FirebaseApp', () => {
    it('should provide a FirebaseApp for the FirebaseApp binding', () => {
      expect(typeof app.delete).toBe('function');
    });
    it('should have the provided name', () => {
      expect(app.name).toBe(APP_NAME);
    })
  });
});
