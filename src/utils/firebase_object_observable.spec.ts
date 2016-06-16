import {
  beforeEach,
  it,
  iit,
  ddescribe,
  describe,
  expect,
  beforeEachProviders,
  inject
} from '@angular/core/testing';
import {
  FIREBASE_PROVIDERS,
  defaultFirebase,
  FirebaseApp,
  FirebaseAppConfig,
  AngularFire
} from '../angularfire2';
import {FirebaseObjectObservable} from './firebase_object_observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/map';
import { database } from 'firebase';

export const firebaseConfig: FirebaseAppConfig = {
  apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
  authDomain: "angularfire2-test.firebaseapp.com",
  databaseURL: "https://angularfire2-test.firebaseio.com",
  storageBucket: "angularfire2-test.appspot.com",
};
const rootUrl = firebaseConfig.databaseURL;

describe('FirebaseObjectObservable', () => {

  var O:FirebaseObjectObservable<any>;
  var ref: firebase.database.Reference;
  var app: firebase.app.App;

  beforeEachProviders(() => [FIREBASE_PROVIDERS, defaultFirebase(firebaseConfig)]);

  beforeEach(inject([FirebaseApp, AngularFire], (firebaseApp: firebase.app.App, _af: AngularFire) => {
    app = firebaseApp;
    ref = database().ref()
    O = new FirebaseObjectObservable((observer:Observer<any>) => {
    }, ref);
  }));

  afterEach(done => {
    ref.off();
    ref.remove();
    app.delete().then(done, done.fail);
  });

  it('should return an instance of FirebaseObservable when calling operators', () => {
    var O = new FirebaseObjectObservable((observer:Observer<any>) => {});
    expect(O.map(noop) instanceof FirebaseObjectObservable).toBe(true);
  });

  describe('set', () => {

    it('should call set on the underlying ref', (done:any) => {
      var setSpy = spyOn(ref, 'set');

      O.subscribe();
      O.set(1);
      expect(setSpy).toHaveBeenCalledWith(1);
      done();
    });

    it('should throw an exception if set when not subscribed', () => {
      O = new FirebaseObjectObservable((observer:Observer<any>) => {});

      expect(() => {
        O.set('foo');
      }).toThrowError('No ref specified for this Observable!')
    });

    it('should accept any type of value without compilation error', () => {
      O.set('foo');
    });


    it('should resolve returned thenable when successful', (done:any) => {
      O.set('foo').then(done, done.fail);
    });

  });

  describe('update', () => {
    const updateObject = { hot: 'firebae' };
    it('should call update on the underlying ref', () => {
      var updateSpy = spyOn(ref, 'update');

      O.subscribe();
      O.update(updateObject);
      expect(updateSpy).toHaveBeenCalledWith(updateObject);
    });

    it('should throw an exception if updated when not subscribed', () => {
      O = new FirebaseObjectObservable((observer:Observer<any>) => {});

      expect(() => {
        O.update(updateObject);
      }).toThrowError('No ref specified for this Observable!')
    });

    it('should accept any type of value without compilation error', () => {
      O.update(updateObject);
    });

    it('should resolve returned thenable when successful', (done:any) => {
      O.update(updateObject).then(done, done.fail);
    });

  });

  describe('remove', () => {

    it('should call remove on the underlying ref', () => {
      var removeSpy = spyOn(ref, 'remove');

      O.subscribe();
      O.remove();
      expect(removeSpy).toHaveBeenCalledWith();
    });

    it('should throw an exception if removed when not subscribed', () => {
      O = new FirebaseObjectObservable((observer:Observer<any>) => {});

      expect(() => {
        O.remove();
      }).toThrowError('No ref specified for this Observable!')
    });

    it('should resolve returned thenable when successful', (done:any) => {
      O.remove().then(done, done.fail);
    });

  });

});

function noop() {}
