import { AngularFireDatabase } from './database';
import { AngularFireDatabaseModule } from './database.module';
import { FirebaseListObservable } from './firebase_list_observable';
import { FirebaseObjectFactory } from './firebase_object_factory';
import { Observer } from 'rxjs/Observer';
import { map } from 'rxjs/operator/map';
import * as firebase from 'firebase/app';
import { unwrapMapFn } from '../utils';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule} from '../angularfire2';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';

describe('FirebaseListObservable', () => {
  let O: FirebaseListObservable<any>;
  let ref: firebase.database.Reference;
  let app: firebase.app.App;
  let db: AngularFireDatabase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFireDatabaseModule
      ]
    });
    inject([FirebaseApp, AngularFireDatabase], (_app: firebase.app.App, _db: AngularFireDatabase) => {
      app = _app;
      db = _db;
      ref = firebase.database().ref();
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
    let orphan = { orphan: true };
    let child:firebase.database.Reference;

    beforeEach(() => {
      child = ref.push(orphan);
    });

    it('should remove the item from the Firebase db when given the key', (done:any) => {
      let childAddedSpy = jasmine.createSpy('childAdded');

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
      let childAddedSpy = jasmine.createSpy('childAdded');

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
      let input = (<any>{lol:true});
      expect(() => O.remove(input)).toThrowError(`Method requires a key, snapshot, reference, or unwrapped snapshot. Got: ${typeof input}`);
    })
  });


  describe('set', () => {
    let orphan = { orphan: true };
    let child:firebase.database.Reference;

    beforeEach(() => {
      child = ref.push(orphan);
    });

    it('should set(replace) the item from the Firebase db when given the key', (done:any) => {
      let childChangedSpy = jasmine.createSpy('childChanged');
      const orphanChange = { changed: true }
      ref.on('child_changed', childChangedSpy);
      O.set(child.key, orphanChange)
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(childChangedSpy.calls.argsFor(0)[0].val()).not.toEqual({
            orphan: true,
            changed: true
          });
          expect(childChangedSpy.calls.argsFor(0)[0].val()).toEqual({
            changed: true
          });

          ref.off();
        })
        .then(done, done.fail);
    });

    it('should set(replace) the item from the Firebase db when given the reference', (done:any) => {
      let childChangedSpy = jasmine.createSpy('childChanged');
      const orphanChange = { changed: true }
      ref.on('child_changed', childChangedSpy);
      O.set(child.ref, orphanChange)
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(childChangedSpy.calls.argsFor(0)[0].val()).not.toEqual({
            orphan: true,
            changed: true
          });
          expect(childChangedSpy.calls.argsFor(0)[0].val()).toEqual({
            changed: true
          });

          ref.off();
        })
        .then(done, done.fail);
    });

    it('should set(replace) the item from the Firebase db when given the snapshot', (done:any) => {
      let childChangedSpy = jasmine.createSpy('childChanged');
      const orphanChange = { changed: true }
      ref.on('child_changed', childChangedSpy);
      O.set(child, orphanChange)
        .then(() => (<any>ref).once('value'))
        .then((data:firebase.database.DataSnapshot) => {
          expect(childChangedSpy.calls.argsFor(0)[0].val()).not.toEqual({
            orphan: true,
            changed: true
          });
          expect(childChangedSpy.calls.argsFor(0)[0].val()).toEqual({
            changed: true
          });

          ref.off();
        })
        .then(done, done.fail);
    });

    it('should set(replace) the item from the Firebase db when given the unwrapped snapshot', (done:any) => {
      const orphanChange = { changed: true }
      ref.on('child_added', (data:firebase.database.DataSnapshot) => {
        expect(data.val()).toEqual(orphan);
        O.set(unwrapMapFn(data), orphanChange)
          .then(() => (<any>child).once('value'))
          .then((data:firebase.database.DataSnapshot) => {
            expect(data.val()).not.toEqual({
              orphan: true,
              changed: true
            });
            expect(data.val()).toEqual({
              changed: true
            });
            ref.off();
          })
          .then(done, done.fail);
      });
    });

  });



  describe('update', () => {
    let orphan = { orphan: true };
    let child:firebase.database.Reference;

    beforeEach(() => {
      child = ref.push(orphan);
    });

    it('should update the item from the Firebase db when given the key', (done:any) => {
      let childChangedSpy = jasmine.createSpy('childChanged');
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
      let childChangedSpy = jasmine.createSpy('childChanged');
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
      let childChangedSpy = jasmine.createSpy('childChanged');
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
