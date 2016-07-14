import { Subscription } from 'rxjs';
import { FirebaseObjectFactory, FirebaseObjectObservable } from './index';
import {
  addProviders,
  inject
} from '@angular/core/testing';
import {
  FIREBASE_PROVIDERS,
  defaultFirebase,
  FirebaseApp,
  FirebaseAppConfig,
  AngularFire
} from '../angularfire2';

export const firebaseConfig: FirebaseAppConfig = {
  apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
  authDomain: "angularfire2-test.firebaseapp.com",
  databaseURL: "https://angularfire2-test.firebaseio.com",
  storageBucket: "angularfire2-test.appspot.com",
};
const rootFirebase = firebaseConfig.databaseURL;

describe('FirebaseObjectFactory', () => {
  var i = 0;
  var ref: firebase.database.Reference;
  var observable: FirebaseObjectObservable<any>;
  var subscription: Subscription;
  var nextSpy: jasmine.Spy;
  var app: firebase.app.App;

  beforeEach(() => {
    addProviders([FIREBASE_PROVIDERS, defaultFirebase(firebaseConfig)]);
    inject([FirebaseApp, AngularFire], (firebaseApp: firebase.app.App, _af: AngularFire) => {
      app = firebaseApp;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('constructor', () => {

    it('should accept a Firebase db url in the constructor', () => {
      const object = FirebaseObjectFactory(app, `${rootFirebase}/questions`);
      expect(object instanceof FirebaseObjectObservable).toBe(true);
    });

    it('should accept a Firebase db ref in the constructor', () => {
      const object = FirebaseObjectFactory(app, firebase.database().ref().child(`questions`));
      expect(object instanceof FirebaseObjectObservable).toBe(true);
    });

  });

  describe('methods', () => {

    beforeEach((done: any) => {
      i = Date.now();
      ref = firebase.database().ref().child(`questions/${i}`);
      nextSpy = nextSpy = jasmine.createSpy('next');
      observable = FirebaseObjectFactory(app, `${rootFirebase}/questions/${i}`);
      ref.remove(done);
    });

    afterEach(() => {
      if (subscription && !subscription.isUnsubscribed) {
        subscription.unsubscribe();
      }
    });


    it('should emit a null value if no value is present when subscribed', (done: any) => {
      subscription = observable.subscribe(val => {
        expect(val).toEqual({ $key: (<any>observable)._ref.key, $value: null });
        done();
      });
    });


    it('should emit unwrapped data by default', (done: any) => {
      ref.set({ unwrapped: 'bar' }, () => {
        subscription = observable.subscribe(val => {
          if (!val) return;
          expect(val).toEqual({ $key: ref.key, unwrapped: 'bar' });
          done();
        });
      });
    });

   it('should emit unwrapped data with a $value property for primitive values', (done: any) => {
      ref.set('fiiiireeee', () => {
        subscription = observable.subscribe(val => {
          if (!val) return;
          expect(val).toEqual({ $key: ref.key, $value: 'fiiiireeee' });
          done();
        });
      });
    });


    it('should emit snapshots if preserveSnapshot option is true', (done: any) => {
      observable = FirebaseObjectFactory(app, `${rootFirebase}/questions/${i}`, { preserveSnapshot: true });
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
      subscription = FirebaseObjectFactory(app, dbRef).subscribe();
      expect(firebaseSpy).not.toHaveBeenCalled();
      subscription.unsubscribe();
      expect(firebaseSpy).toHaveBeenCalled();
    });
  });
});
