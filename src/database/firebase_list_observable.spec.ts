import { FirebaseListObservable } from './index';
import { Observer } from 'rxjs/Observer';
import { map } from 'rxjs/operator/map';
import { database } from 'firebase';
import { unwrapMapFn } from '../utils';
import {
  FIREBASE_PROVIDERS,
  defaultFirebase,
  FirebaseApp,
  FirebaseAppConfig,
  AngularFire,
  AngularFireModule
} from '../angularfire2';
import {
  TestBed,
  inject
} from '@angular/core/testing';
import { COMMON_CONFIG, ANON_AUTH_CONFIG } from '../test-config';

const rootUrl = COMMON_CONFIG.databaseURL;

describe('FirebaseObservable', () => {
  var O:FirebaseListObservable<any>;
  var ref:firebase.database.Reference;
  var app: firebase.app.App;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, ANON_AUTH_CONFIG)]
    });
    inject([FirebaseApp, AngularFire], (firebaseApp: firebase.app.App, _af: AngularFire) => {
      app = firebaseApp;
      ref = database().ref();
      O = new FirebaseListObservable(ref, (observer:Observer<any>) => {
      });
    })();
  });

  afterEach(done => {
    app.delete().then(done, done.fail);
    ref.off();
    ref.remove(done);
  });

  it('should return an instance of FirebaseObservable when calling operators', () => {
    O = new FirebaseListObservable(ref, (observer:Observer<any>) => {
    });
    expect(map.call(O, noop) instanceof FirebaseListObservable).toBe(true);
  });

  describe('$ref', () => {
    // it('should be a firebase.database.Reference', () => {
    //   expect(O.$ref instanceof database.Reference).toBe(true);
    // });

    it('should match the database path passed in the constructor', () => {
      expect(O.$ref.toString()).toEqual(ref.toString());
    });
  });

  describe('push', () => {
    it('should throw an exception if pushed when not subscribed', () => {
      O = new FirebaseListObservable(null, (observer:Observer<any>) => {});

      expect(() => {
        O.push('foo');
      }).toThrowError('No ref specified for this Observable!')
    });

    it('should resolve returned thenable when successful', (done:any) => {
      O.push('foo').then(done, done.fail);
    });
  });


  describe('remove', () => {
    var orphan = { orphan: true };
    var child:firebase.database.Reference;

    beforeEach(() => {
      child = ref.push(orphan);
    });


    it('should remove the item from the Firebase db when given the key', (done:any) => {
      var childAddedSpy = jasmine.createSpy('childAdded');

      ref.on('child_added', childAddedSpy);
      O.remove(child.key)
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(childAddedSpy.calls.argsFor(0)[0].val()).toEqual(orphan);
          expect(data.val()).toBeNull();
          ref.off();
        })
        .then(done, done.fail);
    });


    it('should remove the item from the Firebase db when given the reference', (done:any) => {
      var childAddedSpy = jasmine.createSpy('childAdded');

      ref.on('child_added', childAddedSpy);

      O.remove(child)
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(childAddedSpy.calls.argsFor(0)[0].val()).toEqual(orphan);
          expect(data.val()).toBeNull();
          ref.off();
        })
        .then(done, done.fail);
    });


    it('should remove the item from the Firebase db when given the snapshot', (done:any) => {
      ref.on('child_added', (data:firebase.database.DataSnapshot) => {
        expect(data.val()).toEqual(orphan);
        O.remove(data)
          .then(() => (<any>ref).once('value'))
          .then((data:firebase.database.DataSnapshot) => {
            expect(data.val()).toBeNull();
            ref.off();
          })
          .then(done, done.fail);
      });
    });


    it('should remove the item from the Firebase db when given the unwrapped snapshot', (done:any) => {
      ref.on('child_added', (data:firebase.database.DataSnapshot) => {
        expect(data.val()).toEqual(orphan);
        O.remove(unwrapMapFn(data))
          .then(() => (<any>ref).once('value'))
          .then((data:firebase.database.DataSnapshot) => {
            expect(data.val()).toBeNull();
            ref.off();
          })
          .then(done, done.fail);
      });
    });

    it('should remove the whole list if no item is added', () => {
      O.remove()
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(data.val()).toBe(null);
        });
    });


    it('should throw an exception if input is not supported', () => {
      var input = (<any>{lol:true});
      expect(() => O.remove(input)).toThrowError(`Method requires a key, snapshot, reference, or unwrapped snapshot. Got: ${typeof input}`);
    })
  });

  describe('update', () => {
    var orphan = { orphan: true };
    var child:firebase.database.Reference;

    beforeEach(() => {
      child = ref.push(orphan);
    });

    it('should update the item from the Firebase db when given the key', (done:any) => {
      var childChangedSpy = jasmine.createSpy('childChanged');
      const orphanChange = { changed: true }
      ref.on('child_changed', childChangedSpy);
      O.update(child.key, orphanChange)
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(childChangedSpy.calls.argsFor(0)[0].val()).toEqual({
            orphan: true,
            changed: true
          });

          ref.off();
        })
        .then(done, done.fail);
    });

    it('should update the item from the Firebase db when given the reference', (done:any) => {
      var childChangedSpy = jasmine.createSpy('childChanged');
      const orphanChange = { changed: true }
      ref.on('child_changed', childChangedSpy);
      O.update(child.ref, orphanChange)
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(childChangedSpy.calls.argsFor(0)[0].val()).toEqual({
            orphan: true,
            changed: true
          });

          ref.off();
        })
        .then(done, done.fail);
    });

    it('should update the item from the Firebase db when given the snapshot', (done:any) => {
      var childChangedSpy = jasmine.createSpy('childChanged');
      const orphanChange = { changed: true }
      ref.on('child_changed', childChangedSpy);
      O.update(child, orphanChange)
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(childChangedSpy.calls.argsFor(0)[0].val()).toEqual({
            orphan: true,
            changed: true
          });

          ref.off();
        })
        .then(done, done.fail);
    });

    it('should update the item from the Firebase db when given the unwrapped snapshot', (done:any) => {
      const orphanChange = { changed: true }
      ref.on('child_added', (data:firebase.database.DataSnapshot) => {
        expect(data.val()).toEqual(orphan);
        O.update(unwrapMapFn(data), orphanChange)
          .then(() => (<any>child).once('value'))
          .then((data:firebase.database.DataSnapshot) => {
            expect(data.val()).toEqual({
              orphan: true,
              changed: true
            });
            ref.off();
          })
          .then(done, done.fail);
      });
    });

  });

});

function noop() {}
