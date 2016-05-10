import {
  describe,
  ddescribe,
  it,
  iit,
  beforeEach,
  beforeEachProviders,
  expect,
  inject,
  injectAsync,
  async
} from '@angular/core/testing';
import {ReflectiveInjector, provide, Provider} from '@angular/core';
import {
  AngularFire,
  FirebaseObjectObservable,
  FIREBASE_PROVIDERS,
  FirebaseAuth,
  FirebaseUrl,
  FirebaseRef,
  defaultFirebase,
  FirebaseDatabase
} from './angularfire2';
import {Subscription} from 'rxjs';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/delay';

// Only use this URL for angularfire2.spec.ts
const localServerUrl = 'https://angularfire2.firebaseio-demo.com/';

describe('angularfire', () => {
  var subscription:Subscription;
  const questionsRef = new Firebase(localServerUrl).child('questions');
  const listOfQuestionsRef = new Firebase(localServerUrl).child('list-of-questions');

  afterEach((done:any) => {
    // Clear out the Firebase to prevent leaks between tests
    (new Firebase(localServerUrl)).remove(done);
    if(subscription && !subscription.isUnsubscribed) {
      subscription.unsubscribe();
    }
  });


  it('should be injectable via FIREBASE_PROVIDERS', () => {
    var injector = ReflectiveInjector.resolveAndCreate([FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);
    expect(injector.get(AngularFire)).toBeAnInstanceOf(AngularFire);
  });

  describe('.auth', () => {
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);

    it('should be an instance of AuthService', inject([AngularFire], (af:AngularFire) => {
      expect(af.auth).toBeAnInstanceOf(FirebaseAuth);
    }));
  });
  
  
  describe('.database', () => {
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);

    it('should be an instance of AuthService', inject([AngularFire], (af:AngularFire) => {
      expect(af.database).toBeAnInstanceOf(FirebaseDatabase);
    }));
  });

  describe('FIREBASE_REF', () => {
    it('should provide a FirebaseRef for the FIREBASE_REF binding', () => {
      var injector = ReflectiveInjector.resolveAndCreate([
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
      const injector = ReflectiveInjector.resolveAndCreate([defaultFirebase(localServerUrl), FIREBASE_PROVIDERS]);
      expect(injector.get(FirebaseRef).toString()).toBe(localServerUrl);
    });
  });

});
