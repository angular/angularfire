import { Subscription } from 'rxjs';
import { FirebaseObjectFactory, FirebaseObjectObservable } from './index';
import {
  TestBed,
  inject
} from '@angular/core/testing';
import {
  FIREBASE_PROVIDERS,
  defaultFirebase,
  FirebaseApp,
  FirebaseAppConfig,
  AngularFire,
  AngularFireModule
} from '../angularfire2';
import { COMMON_CONFIG, ANON_AUTH_CONFIG } from '../test-config';

const rootDatabaseUrl = COMMON_CONFIG.databaseURL;

describe('FirebaseObjectFactory', () => {
  var i = 0;
  var ref: firebase.database.Reference;
  var observable: FirebaseObjectObservable<any>;
  var subscription: Subscription;
  var nextSpy: jasmine.Spy;
  var app: firebase.app.App;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, ANON_AUTH_CONFIG)]
    });
    inject([FirebaseApp, AngularFire], (firebaseApp: firebase.app.App, _af: AngularFire) => {
      app = firebaseApp;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('constructor', () => {

    it('should accept a Firebase db url in the constructor', () => {
      const object = FirebaseObjectFactory(`${rootDatabaseUrl}/questions`);
      expect(object instanceof FirebaseObjectObservable).toBe(true);
    });

    it('should accept a Firebase db ref in the constructor', () => {
      const object = FirebaseObjectFactory(firebase.database().ref().child(`questions`));
      expect(object instanceof FirebaseObjectObservable).toBe(true);
    });

  });

  describe('methods', () => {

    beforeEach((done: any) => {
      i = Date.now();
      ref = firebase.database().ref().child(`questions/${i}`);
      nextSpy = nextSpy = jasmine.createSpy('next');
      observable = FirebaseObjectFactory(`${rootDatabaseUrl}/questions/${i}`);
      ref.remove(done);
    });

    afterEach(() => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
      }
    });


    it('should emit a null value if no value is present when subscribed', (done: any) => {
      subscription = observable.subscribe(unwrapped => {
        const expectedObject = { $key: (<any>observable).$ref.key, $value: null };
        expect(unwrapped.$key).toEqual(expectedObject.$key);
        expect(unwrapped.$value).toEqual(expectedObject.$value);
        expect(unwrapped.$exists()).toEqual(false);
        done();
      });
    });


    it('should emit unwrapped data by default', (done: any) => {
      const fixtureData = { data: 'bar' };
      ref.set(fixtureData, () => {
        subscription = observable.subscribe(unwrapped => {
          if (!unwrapped) return;
          expect(unwrapped.$key).toEqual(ref.key);
          expect(unwrapped).toEqual(fixtureData);
          expect(unwrapped.$exists()).toEqual(true);
          done();
        });
      });
    });

   it('should emit unwrapped data with $ properties for primitive values', (done: any) => {
      ref.set('fiiiireeee', () => {
        subscription = observable.subscribe(val => {
          if (!val) return;
          expect(val.$key).toEqual(ref.key);
          expect(val.$value).toEqual('fiiiireeee');
          expect(val.$exists()).toEqual(true);
          done();
        });
      });
    });

   it('should emit null for $ properties for primitive values', (done: any) => {
     subscription = observable.subscribe(val => {
       if (!val) return;
       expect(val.$key).toEqual(ref.key);
       expect(val.$value).toEqual(null);
       expect(val.$exists()).toEqual(false);
       done();
     });
    });

    it('should emit snapshots if preserveSnapshot option is true', (done: any) => {
      observable = FirebaseObjectFactory(`${rootDatabaseUrl}/questions/${i}`, { preserveSnapshot: true });
      ref.remove(() => {
        ref.set('preserved snapshot!', () => {
          subscription = observable.subscribe(data => {
            expect(data.val()).toEqual('preserved snapshot!');
            done();
          });
        });
      })
    });


    it('should call off on all events when disposed', () => {
      const dbRef = firebase.database().ref();
      var firebaseSpy = spyOn(dbRef, 'off');
      subscription = FirebaseObjectFactory(dbRef).subscribe();
      expect(firebaseSpy).not.toHaveBeenCalled();
      subscription.unsubscribe();
      expect(firebaseSpy).toHaveBeenCalled();
    });
  });
});
