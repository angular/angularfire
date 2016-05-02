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
    var injector = Injector.resolveAndCreate([FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);
    expect(injector.get(AngularFire)).toBeAnInstanceOf(AngularFire);
  });

  describe('.list()', () => {
    var af:AngularFire;
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);
    beforeEach(inject([AngularFire], (_af:AngularFire) => {
      af = _af;
    }));


    it('should accept an absolute url', () => {
      expect(af.list(localServerUrl)._ref.toString()).toEqual(localServerUrl);
    });


    it('should return an observable of the path', (done:any) => {
      var questions = af.list(`/questions`);
      questionsRef.push({pathObservable:true}, () => {
        subscription = questions
          .take(1)
          .do((data:any) => {
            expect(data.length).toBe(1);
            expect(data[0].pathObservable).toBe(true);
          })
          .subscribe(done, done.fail);
      });
    });


    it('should preserve snapshots in the list if preserveSnapshot option specified', (done:any) => {
      var questions = af.list(`list-of-questions`, {preserveSnapshot: true});
      listOfQuestionsRef.push('hello', () => {
        subscription = questions
          .take(1)
          .do((data:any) => {
            expect(data[0].val()).toEqual('hello');
          })
          .subscribe(done, done.fail);
      });
    });
  });


  describe('.object()', () => {
    var observable:FirebaseObjectObservable<any>;
    var af:AngularFire;

    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);
    beforeEach(inject([AngularFire], (_af:AngularFire) => {
      observable = _af.object(`/list-of-questions/1`)
      af = _af;
    }));


    it('should accept an absolute url', () => {
      expect((<any>af.object(localServerUrl))._ref.toString()).toBe(localServerUrl);
    });


    it('should return an observable of the path', injectAsync([AngularFire], (af:AngularFire) => {
      return (<any>observable)._ref.set({title: 'how to firebase?'})
        .then(() => observable.take(1).toPromise())
        .then((data:any) => {
          expect(data).toEqual({title: 'how to firebase?'});
        });
    }));


    it('should preserve snapshot if preserveSnapshot option specified', injectAsync([AngularFire], (af:AngularFire) => {
      observable = af.object(`list-of-questions/`, {preserveSnapshot: true});
      return (<any>observable)._ref.set({title: 'how to firebase?'})
        .then(() => observable.take(1).toPromise())
        .then((data:any) => {
          expect(data.val()).toEqual({title: 'how to firebase?'});
        });
    }));
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
