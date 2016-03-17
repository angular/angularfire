import {
  describe,
  it,
  iit,
  beforeEach,
  beforeEachProviders,
  expect,
  inject
} from 'angular2/testing';
import {Injector, provide, Provider} from 'angular2/core';
import {
  AngularFire,
  FIREBASE_PROVIDERS,
  WORKER_APP_FIREBASE_PROVIDERS,
  FirebaseAuth,
  FirebaseUrl,
  FirebaseRef,
  defaultFirebase
} from './angularfire2';
import {FirebaseObjectObservable} from './utils/firebase_object_observable';
import {Subscription} from 'rxjs';

const testUrl = 'http://localhost.firebaseio.test:5000/';
const realUrl = 'http://lololol.firebaseio-demo.com/';

describe('angularfire', () => {
  it('should be injectable via FIREBASE_PROVIDERS', () => {
    var injector = Injector.resolveAndCreate([FIREBASE_PROVIDERS, defaultFirebase(realUrl)]);
    expect(injector.get(AngularFire)).toBeAnInstanceOf(AngularFire);
  });

  describe('.list()', () => {
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(testUrl)]);

    it('should return an observable of the path', inject([AngularFire], (af:AngularFire) => {
      var nextSpy = jasmine.createSpy('next');
      var questions = af.list('list-of-questions');
      questions.subscribe((data) => {
        console.log(data);
        nextSpy();
      });
      questions.add('hello');
      expect(nextSpy.calls.first().args[0]).toBeUndefined();
      expect(nextSpy.calls.mostRecent().args[1]).toBe('hello');
    }));


    it('should preserve snapshots in the list if preserveSnapshot option specified', inject([AngularFire], (af:AngularFire) => {
      var nextSpy = jasmine.createSpy('next');
      var questions = af.list('list-of-questions', {preserveSnapshot: true});
      questions.subscribe((data) => {
        console.log(data);
        nextSpy();
      });
      questions.add('hello');
      expect(nextSpy.calls.first().args[0][0].val()).toEqual('hello');
    }));
  });


  describe('.object()', () => {
    var nextSpy:jasmine.Spy;
    var ref = new Firebase(`${testUrl}list-of-questions/1`);
    var observable:FirebaseObjectObservable<any>;
    var subscription:Subscription;
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(testUrl)]);
    beforeEach(inject([AngularFire], (af:AngularFire) => {
      nextSpy = jasmine.createSpy('next');
      observable = af.object('/list-of-questions/1')
      ref.remove();
    }));

    afterEach(() => {
      subscription.unsubscribe();
    });

    it('should return an observable of the path', inject([AngularFire], (af:AngularFire) => {
      ref.set({title: 'how to firebase?'});
      subscription = observable.subscribe(nextSpy);
      expect(nextSpy.calls.first().args[0]).toEqual({title: 'how to firebase?'});
      console.log(nextSpy.calls.count())
    }));


    it('should preserve snapshot if preserveSnapshot option specified', inject([AngularFire], (af:AngularFire) => {
      observable = af.object('list-of-questions/1', {preserveSnapshot: true});
      ref.set({title: 'how to firebase?'});
      subscription = observable.subscribe(nextSpy);
      expect(nextSpy.calls.first().args[0].val()).toEqual({title: 'how to firebase?'});
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
