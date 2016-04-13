import {FirebaseObjectFactory} from '../utils/firebase_object_factory';
import {FirebaseObjectObservable} from '../utils/firebase_object_observable';
import {beforeEach, it, describe, expect} from 'angular2/testing';
import {Subscription} from 'rxjs';

const rootFirebase = 'https://angularfire2-object-factory.firebaseio-demo.com';

describe('FirebaseObjectFactory', () => {
  var i = 0;
  var ref: Firebase;
  var observable: FirebaseObjectObservable<any>;
  var subscription: Subscription;
  var nextSpy: jasmine.Spy;

  describe('constructor', () => {

    it('should accept a Firebase db url in the constructor', () => {
      const object = FirebaseObjectFactory(`${rootFirebase}/questions`);
      expect(object).toBeAnInstanceOf(FirebaseObjectObservable);
    });

    it('should accept a Firebase db ref in the constructor', () => {
      const object = FirebaseObjectFactory(new Firebase(`${rootFirebase}/questions`));
      expect(object).toBeAnInstanceOf(FirebaseObjectObservable);
    });

  });

  describe('methods', () => {

    beforeEach((done: any) => {
      i = Date.now();
      ref = new Firebase(`${rootFirebase}/questions/${i}`);
      nextSpy = nextSpy = jasmine.createSpy('next');
      observable = FirebaseObjectFactory(`${rootFirebase}/questions/${i}`);
      ref.remove(done);
    });

    afterEach(() => {
      if (subscription && !subscription.isUnsubscribed) {
        subscription.unsubscribe();
      }
    })


    it('should emit a null value if no value is present when subscribed', (done: any) => {
      subscription = observable.subscribe(val => {
        expect(val).toBe(null);
        done();
      });
    });


    it('should emit unwrapped data by default', (done: any) => {
      ref.set({ unwrapped: 'bar' }, () => {
        subscription = observable.subscribe(val => {
          if (!val) return
          expect(val).toEqual({ unwrapped: 'bar' });
          done();
        });
      });
    });


    it('should emit snapshots if preserveSnapshot option is true', (done: any) => {
      observable = FirebaseObjectFactory(`${rootFirebase}/questions/${i}`, { preserveSnapshot: true });
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
      var firebaseSpy = spyOn(Firebase.prototype, 'off');
      subscription = FirebaseObjectFactory(rootFirebase).subscribe();
      expect(firebaseSpy).not.toHaveBeenCalled();
      subscription.unsubscribe();
      expect(firebaseSpy).toHaveBeenCalled();
    });
  });
});
