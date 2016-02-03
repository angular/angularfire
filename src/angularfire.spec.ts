import {
  describe,
  it,
  beforeEach,
  beforeEachProviders,
  expect,
  inject
} from 'angular2/testing';
import {Injector, provide, Provider} from 'angular2/core';
import {
  AngularFire,
  FIREBASE_PROVIDERS,
  FirebaseAuth,
  FirebaseUrl,
  FirebaseRef,
  defaultFirebase
} from './angularfire';

const testUrl = 'http://localhost.firebaseio.test:5000/';

describe('angularfire', () => {
  it('should be injectable via FIREBASE_PROVIDERS', () => {
    var injector = Injector.resolveAndCreate([FIREBASE_PROVIDERS, defaultFirebase(testUrl)]);
    expect(injector.get(AngularFire)).toBeAnInstanceOf(AngularFire);
  });

  describe('.list()', () => {
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(testUrl)]);

    it('should return an observable of the path', inject([AngularFire], (af:AngularFire) => {
      var nextSpy = jasmine.createSpy('next');
      var questions = af.list('list-of-questions');
      questions.subscribe(nextSpy);
      questions.add(['hello']);
      expect(nextSpy.calls.first().args[0][0].val()).toEqual(['hello']);
    }));
  });


  describe('.auth', () => {
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(testUrl)]);

    it('should be an instance of AuthService', inject([AngularFire], (af:AngularFire) => {
      expect(af.auth).toBeAnInstanceOf(FirebaseAuth);
    }));
  });


  describe('FIREBASE_REF', () => {
    it('should provide a FirebaseRef for the FIREBASE_REF binding', () => {
      var injector = Injector.resolveAndCreate([
        provide(FirebaseUrl, {
          useValue: testUrl
        }),
        FIREBASE_PROVIDERS
      ]);
      expect(typeof injector.get(FirebaseRef).on).toBe('function');
    })
  });

  describe('defaultFirebase', () => {
    it('should create a provider', () => {
      const provider = defaultFirebase(testUrl);
      expect(provider).toBeAnInstanceOf(Provider);
    });


    it('should inject a FIR reference', () => {
      const injector = Injector.resolveAndCreate([defaultFirebase(testUrl), FIREBASE_PROVIDERS]);
      expect(injector.get(FirebaseRef).toString()).toBe(testUrl);
    });
  });

});
