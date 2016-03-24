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
import {
  FirebaseObjectObservable,
  FIREBASE_PROVIDERS,
  FirebaseUrl,
  FirebaseRef,
  defaultFirebase
} from '../angularfire2';
import {FirebaseDatabase} from './database';
import {Subscription} from 'rxjs';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/do';

const localServerUrl = 'http://localhost.firebaseio.test:5000/';

describe('FirebaseDatabase', () => {
  var subscription: Subscription;

  describe('.list()', () => {
    var db: FirebaseDatabase;
    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);
    beforeEach(inject([FirebaseDatabase], (_db: FirebaseDatabase) => {
      db = _db;
    }));

    it('should accept an absolute url', () => {
      expect((<any>db.list(localServerUrl))._ref.toString()).toBe(localServerUrl);
    });

    it('should return an observable of the path', (done: any) => {
      var questions = db.list(`/questions`);
      (<any>questions)._ref.push({ pathObservable: true }, () => {
        subscription = questions
          .take(1)
          .do((data: any) => {
            expect(data.length).toBe(1);
            expect(data[0].pathObservable).toBe(true);
          })
          .subscribe(done, done.fail);
      });
    });


    it('should preserve snapshots in the list if preserveSnapshot option specified', (done: any) => {
      var questions = db.list(`list-of-questions`, { preserveSnapshot: true });
      (<any>questions)._ref.push('hello', () => {
        subscription = questions
          .take(1)
          .do((data: any) => {
            expect(data[0].val()).toEqual('hello');
          })
          .subscribe(done, done.fail);
      });
    });
  });

  describe('.object()', () => {
    var observable: FirebaseObjectObservable<any>;
    var db: FirebaseDatabase;

    beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(localServerUrl)]);
    beforeEach(inject([FirebaseDatabase], (_db: FirebaseDatabase) => {
      observable = _db.object(`/list-of-questions/1`)
      db = _db;
    }));

    it('should accept an absolute url', () => {
      expect((<any>db.object(localServerUrl))._ref.toString()).toBe(localServerUrl);
    });

    it('should return an observable of the path', injectAsync([FirebaseDatabase], (db: FirebaseDatabase) => {
      return (<any>observable)._ref.set({ title: 'how to firebase?' })
        .then(() => observable.take(1).toPromise())
        .then((data: any) => {
          expect(data).toEqual({ title: 'how to firebase?' });
        });
    }));


    it('should preserve snapshot if preserveSnapshot option specified', injectAsync([FirebaseDatabase], (db: FirebaseDatabase) => {
      observable = db.object(`list-of-questions/`, { preserveSnapshot: true });
      return (<any>observable)._ref.set({ title: 'how to firebase?' })
        .then(() => observable.take(1).toPromise())
        .then((data: any) => {
          expect(data.val()).toEqual({ title: 'how to firebase?' });
        });
    }));
  });

});

