import {describe,it,beforeEach} from 'angular2/testing';
import {Injector, provide} from 'angular2/core';
import {FIREBASE_PROVIDERS, FirebaseUrl, FirebaseRef} from './angularfire';

describe('angularfire', () => {
  describe('FIREBASE_REF', () => {
    it('should provide a FirebaseRef for the FIREBASE_REF binding', () => {
      var injector = Injector.resolveAndCreate([
        provide(FirebaseUrl, {
          useValue: 'https://ng2-forum-demo.firebaseio.com'
        }),
        FIREBASE_PROVIDERS
      ]);
      expect(typeof injector.get(FirebaseRef).on).toBe('function');
    })
  });
});
