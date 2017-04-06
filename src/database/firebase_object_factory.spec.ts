import * as firebase from 'firebase/app';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operator/take';
import { toPromise } from 'rxjs/operator/toPromise';
import { FirebaseObjectFactory, FirebaseObjectObservable, AngularFireDatabaseModule, AngularFireDatabase } from './index';
import { TestBed, inject } from '@angular/core/testing';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from '../angularfire2';
import { COMMON_CONFIG } from '../test-config';
import { unwrapSnapshot } from './unwrap_snapshot';

describe('FirebaseObjectFactory', () => {
  let i = 0;
  let ref: firebase.database.Reference;
  let observable: FirebaseObjectObservable<any>;
  let subscription: Subscription;
  let nextSpy: jasmine.Spy;
  let app: firebase.app.App;
  let db: AngularFireDatabase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, '[DEFAULT]'),
        AngularFireDatabaseModule
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (app_: FirebaseApp, _db: AngularFireDatabase) => {
      app = app_;
      db = _db;
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
  });

  describe('<constructor>', () => {

    it('should accept a Firebase db url in the constructor', () => {
      const object = FirebaseObjectFactory(`questions`);
      expect(object instanceof FirebaseObjectObservable).toBe(true);
    });

    it('should accept a Firebase db ref in the constructor', () => {
      const object = FirebaseObjectFactory(firebase.database().ref().child(`questions`));
      expect(object instanceof FirebaseObjectObservable).toBe(true);
    });

    it('should take an absolute url in the constructor', () => {
      const absoluteUrl = COMMON_CONFIG.databaseURL + '/questions/one';
      const list = FirebaseObjectFactory(absoluteUrl);
      expect(list instanceof FirebaseObjectObservable).toBe(true);
    });

  });

  describe('methods', () => {

    beforeEach((done: any) => {
      i = Date.now();
      ref = firebase.database().ref().child(`questions/${i}`);
      nextSpy = nextSpy = jasmine.createSpy('next');
      observable = FirebaseObjectFactory(`questions/${i}`);
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
      observable = FirebaseObjectFactory(`questions/${i}`, { preserveSnapshot: true });
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
      let firebaseSpy = spyOn(dbRef, 'off');
      subscription = FirebaseObjectFactory(dbRef).subscribe();
      expect(firebaseSpy).not.toHaveBeenCalled();
      subscription.unsubscribe();
      expect(firebaseSpy).toHaveBeenCalled();
    });

    it('should emit values in the observable creation zone', (done: any) => {
      Zone.current.fork({
        name: 'newZone'
      })
      .run(() => {
        // Creating a new observable so that the current zone is captured.
        subscription = FirebaseObjectFactory(`questions/${i}`)
          .filter(d => d.$value === 'in-the-zone')
          .subscribe(data => {
            expect(Zone.current.name).toBe('newZone');
            done();
          });
      });

      ref.remove(() => {
        ref.set('in-the-zone');
      });
    });
  });

  describe('unwrapSnapshot', () => {

    let ref: firebase.database.Reference;
    let subscription: Subscription;

    beforeEach((done: any) => {

      ref = firebase.database().ref('test');
      ref.remove()
        .then(done)
        .catch(done.fail);
    });

    afterEach((done: any) => {
      if (subscription && !subscription.closed) {
        subscription.unsubscribe();
      }
      ref.remove()
        .then(done)
        .catch(done.fail);
    });

    it('should use the specified unwrapSnapshot implementation', (done: any) => {

      ref.set({ 'key1': 'val1' })
        .then(() => {
          let observable = FirebaseObjectFactory(ref, {
            unwrapSnapshot: (snapshot) => {
              const unwrapped = unwrapSnapshot(snapshot);
              (unwrapped as any).custom = true;
              return unwrapped;
            }
          });
          return toPromise.call(take.call(observable, 1));
        })
        .then((obj: any) => {
          expect(obj.$key).toBe('test');
          expect(obj.key1).toBe('val1');
          expect(obj.custom).toBe(true);
        })
        .then(done)
        .catch(done.fail);
    });

  });

});
