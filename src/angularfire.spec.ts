require('reflect-metadata');
import {describe,it,beforeEach} from 'angular2/testing';
import {Injector, provide} from 'angular2/core';
import {FIREBASE_PROVIDERS, DEFAULT_FIREBASE, DEFAULT_FIREBASE_REF} from './angularfire';

describe('angularfire', () => {
  describe('DEFAULT_FIREBASE_REF', () => {
    it('should provide a FirebaseRef for the DEFAULT_FIREBASE_REF binding', () => {
      var injector = Injector.resolveAndCreate([
        provide(DEFAULT_FIREBASE, {
          useValue: 'https://ng2-forum-demo.firebaseio.com'
        }),
        FIREBASE_PROVIDERS
      ]);
      expect(typeof injector.get(DEFAULT_FIREBASE_REF).on).toBe('function');
    })
  });
});
