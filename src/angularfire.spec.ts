import {describe,it,beforeEach, expect, inject} from 'angular2/testing';
import {Injector, provide, Provider} from 'angular2/core';
import {FIREBASE_PROVIDERS, FirebaseUrl, FirebaseRef, defaultFirebase} from './angularfire';

const testUrl = 'https://ng2-forum-demo.firebaseio.com/';

describe('angularfire', () => {
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
