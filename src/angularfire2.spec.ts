import {
  TestBed,
  inject
} from '@angular/core/testing';
import { ReflectiveInjector, Provider } from '@angular/core';
import {
  AngularFire,
  FirebaseObjectObservable,
  FIREBASE_PROVIDERS,
  AngularFireAuth,
  FirebaseConfig,
  FirebaseApp,
  defaultFirebase,
  AngularFireDatabase,
  FirebaseAppConfig,
  AngularFireModule
} from './angularfire2';
import { Subscription } from 'rxjs/Subscription';
import { COMMON_CONFIG, ANON_AUTH_CONFIG } from './test-config';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/delay';

fdescribe('angularfire', () => {
  var subscription:Subscription;
  var app: firebase.app.App;
  var rootRef: firebase.database.Reference;
  var questionsRef: firebase.database.Reference;
  var listOfQuestionsRef: firebase.database.Reference;
  var angularFire2: AngularFire;

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, ANON_AUTH_CONFIG)]
    });

    inject([FirebaseApp, AngularFire], (firebaseApp: firebase.app.App, _af: AngularFire) => {
      angularFire2 = _af;
      app = firebaseApp;
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
    expect(angularFire2 instanceof AngularFire).toBe(true);
  });

  describe('.auth', () => {
    it('should be an instance of AuthService', inject([AngularFire], (af:AngularFire) => {
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
    })
  });

  describe('defaultFirebase', () => {
    it('should create an array of providers', () => {
      const providers = defaultFirebase(COMMON_CONFIG);
      expect(providers.length).toBe(2);
    });
  });
});
