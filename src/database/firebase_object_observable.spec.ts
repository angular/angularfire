import { TestBed, inject } from '@angular/core/testing';
import { FIREBASE_PROVIDERS, FirebaseApp, FirebaseAppConfig, AngularFire, AngularFireModule } from '../angularfire2';
import { COMMON_CONFIG, ANON_AUTH_CONFIG } from '../test-config';
import { FirebaseObjectObservable, AngularFireDatabaseModule, AngularFireDatabase } from './index';
import { Observer } from 'rxjs/Observer';
import { map } from 'rxjs/operator/map';
import * as firebase from 'firebase/app';

describe('FirebaseObjectObservable', () => {

  let O: FirebaseObjectObservable<any>;
  let ref: firebase.database.Reference;
  let app: firebase.app.App;
  let db: AngularFireDatabase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, ANON_AUTH_CONFIG),
        AngularFireDatabaseModule
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (_app: firebase.app.App, _db: AngularFireDatabase) => {
      app = _app;
      db = _db;
      ref = firebase.database().ref();
      O = new FirebaseObjectObservable((observer: Observer<any>) => {
      }, ref);
    })();
  });

  afterEach(done => {
    ref.off();
    ref.remove();
    app.delete().then(done, done.fail);
  });

  it('should return an instance of FirebaseObservable when calling operators', () => {
    let O = new FirebaseObjectObservable((observer: Observer<any>) => { });
    expect(map.call(O, noop) instanceof FirebaseObjectObservable).toBe(true);
  });

  describe('$ref', () => {
    it('should match the database path passed in the constructor', () => {
      expect(O.$ref.toString()).toEqual(ref.toString());
    });
  });

  describe('set', () => {

    it('should call set on the underlying ref', (done: any) => {
      let setSpy = spyOn(ref, 'set');

      O.subscribe();
      O.set(1);
      expect(setSpy).toHaveBeenCalledWith(1);
      done();
    });

    it('should throw an exception if set when not subscribed', () => {
      O = new FirebaseObjectObservable((observer: Observer<any>) => { });

      expect(() => {
        O.set('foo');
      }).toThrowError('No ref specified for this Observable!')
    });

    it('should accept any type of value without compilation error', () => {
      O.set('foo');
    });


    it('should resolve returned thenable when successful', (done: any) => {
      O.set('foo').then(done, done.fail);
    });

  });

  describe('update', () => {
    const updateObject = { hot: 'firebae' };
    it('should call update on the underlying ref', () => {
      let updateSpy = spyOn(ref, 'update');

      O.subscribe();
      O.update(updateObject);
      expect(updateSpy).toHaveBeenCalledWith(updateObject);
    });

    it('should throw an exception if updated when not subscribed', () => {
      O = new FirebaseObjectObservable((observer: Observer<any>) => { });

      expect(() => {
        O.update(updateObject);
      }).toThrowError('No ref specified for this Observable!')
    });

    it('should accept any type of value without compilation error', () => {
      O.update(updateObject);
    });

    it('should resolve returned thenable when successful', (done: any) => {
      O.update(updateObject).then(done, done.fail);
    });

  });

  describe('remove', () => {

    it('should call remove on the underlying ref', () => {
      let removeSpy = spyOn(ref, 'remove');

      O.subscribe();
      O.remove();
      expect(removeSpy).toHaveBeenCalledWith();
    });

    it('should throw an exception if removed when not subscribed', () => {
      O = new FirebaseObjectObservable((observer: Observer<any>) => { });

      expect(() => {
        O.remove();
      }).toThrowError('No ref specified for this Observable!')
    });

    it('should resolve returned thenable when successful', (done: any) => {
      O.remove().then(done, done.fail);
    });

  });

});

function noop() { }
