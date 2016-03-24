import {
  describe,
  ddescribe,
  it,
  iit,
  beforeEach,
  beforeEachProviders,
  expect,
  inject,
  injectAsync
} from 'angular2/testing';
import {Injector, provide, Provider} from 'angular2/core';
import {
  AngularFire,
  FirebaseObjectObservable,
  FIREBASE_PROVIDERS,
  FirebaseAuth,
  FirebaseUrl,
  FirebaseRef,
  defaultFirebase
} from './angularfire2';
import {Subscription} from 'rxjs';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/do';

const localServerUrl = 'http://localhost.firebaseio.test:5000/';

describe('angularfire', () => {
  var subscription:Subscription;

  afterEach((done:any) => {
    // Clear out the Firebase to prevent leaks between tests
    (new Firebase(localServerUrl)).remove(done);
    if(subscription && !subscription.isUnsubscribed) {
      subscription.unsubscribe();
    }
  });

  it('should be injectable via FIREBASE_PROVIDERS', () => {
    var injector = Injector.resolveAndCreate([FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);
    expect(injector.get(AngularFire)).toBeAnInstanceOf(AngularFire);
  });

  describe('.auth', () => {
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);

    it('should be an instance of AuthService', inject([AngularFire], (af:AngularFire) => {
      expect(af.auth).toBeAnInstanceOf(FirebaseAuth);
    }));
  });
  
  describe('FIREBASE_REF', () => {
    it('should provide a FirebaseRef for the FIREBASE_REF binding', () => {
      var injector = Injector.resolveAndCreate([
        provide(FirebaseUrl, {
          useValue: localServerUrl
        }),
        FIREBASE_PROVIDERS
      ]);
      expect(typeof injector.get(FirebaseRef).on).toBe('function');
    })
  });

  describe('defaultFirebase', () => {
    it('should create a provider', () => {
      const provider = defaultFirebase(localServerUrl);
      expect(provider).toBeAnInstanceOf(Provider);
    });


    it('should inject a FIR reference', () => {
      const injector = Injector.resolveAndCreate([defaultFirebase(localServerUrl), FIREBASE_PROVIDERS]);
      expect(injector.get(FirebaseRef).toString()).toBe(localServerUrl);
    });
  });

});
