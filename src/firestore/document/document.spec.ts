import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFirestore } from '../firestore';
import { AngularFirestoreModule } from '../firestore.module';
import { AngularFirestoreDocument } from '../document/document';

import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from '../test-config';

import { Stock, randomName, FAKE_STOCK_DATA } from '../utils.spec';

describe('AngularFirestoreDocument', () => {
  let app: firebase.app.App;
  let afs: AngularFirestore;
  let sub: Subscription;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFirestoreModule
      ]
    });
    inject([FirebaseApp, AngularFirestore], (_app: firebase.app.App, _afs: AngularFirestore) => {
      app = _app;
      afs = _afs;
    })();
  });

  afterEach(async (done) => {
    await app.delete();
    done();
  });

  it('should get action updates', async (done: any) => {
    const randomCollectionName = randomName(afs.firestore);
    const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`);
    const stock = new AngularFirestoreDocument<Stock>(ref);
    await stock.set(FAKE_STOCK_DATA);
    const sub = stock
      .snapshotChanges()
      .subscribe(async a => {
        sub.unsubscribe();
        if (a.payload.exists) {
          expect(a.payload.data()).toEqual(FAKE_STOCK_DATA);
          stock.delete().then(done).catch(done.fail);
        }
      });
  });

  it('should get unwrapped snapshot', async (done: any) => {
    const randomCollectionName = afs.firestore.collection('a').doc().id;
    const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`);
    const stock = new AngularFirestoreDocument<Stock>(ref);
    await stock.set(FAKE_STOCK_DATA);
    const obs$ = stock.valueChanges();
    const sub = obs$.catch(e => { console.log(e); return e; })
      .take(1) // this will unsubscribe after the first
      .subscribe(async (data: Stock) => {
        sub.unsubscribe();
        expect(JSON.stringify(data)).toBe(JSON.stringify(FAKE_STOCK_DATA));
        stock.delete().then(done).catch(done.fail);
      });
  });

});
