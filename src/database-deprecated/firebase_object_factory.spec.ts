
import {filter} from 'rxjs/operators';
import { FirebaseApp as FBApp } from '@firebase/app-types';
import { Reference } from '@firebase/database-types';
import { Subscription } from 'rxjs';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule, FirebaseObjectObservable, FirebaseObjectFactory } from 'angularfire2/database-deprecated';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';

describe('FirebaseObjectFactory', () => {
  let i = 0;
  let ref: Reference;
  let observable: FirebaseObjectObservable<any>;
  let subscription: Subscription;
  let nextSpy: jasmine.Spy;
  let app: FBApp;
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

    it('should accept a Firebase db ref in the constructor', () => {
      const object = FirebaseObjectFactory(app.database().ref().child(`questions`));
      expect(object instanceof FirebaseObjectObservable).toBe(true);
    });

  });

  describe('methods', () => {

    beforeEach((done: any) => {
      i = Date.now();
      ref = app.database().ref().child(`questions/${i}`);
      nextSpy = nextSpy = jasmine.createSpy('next');
      observable = FirebaseObjectFactory(app.database().ref(`questions/${i}`));
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
      observable = FirebaseObjectFactory(app.database().ref(`questions/${i}`), { preserveSnapshot: true });
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
      const dbRef = app.database().ref();
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
        subscription = FirebaseObjectFactory(app.database().ref(`questions/${i}`)).pipe(
          filter(d => d.$value === 'in-the-zone'))
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
});
