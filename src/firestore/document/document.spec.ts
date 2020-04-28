import { AngularFireModule, FirebaseApp } from '@angular/fire';
import { AngularFirestore, SETTINGS } from '../firestore';
import { AngularFirestoreModule } from '../firestore.module';
import { AngularFirestoreDocument } from '../document/document';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { inject, TestBed } from '@angular/core/testing';
import { COMMON_CONFIG } from '../../test-config';

import { FAKE_STOCK_DATA, rando, randomName, Stock } from '../utils.spec';
import 'firebase/firestore';

describe('AngularFirestoreDocument', () => {
  let app: FirebaseApp;
  let afs: AngularFirestore;
  let sub: Subscription;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, rando()),
        AngularFirestoreModule
      ],
      providers: [
        { provide: SETTINGS, useValue: { host: 'localhost:8080', ssl: false } }
      ]
    });
    inject([FirebaseApp, AngularFirestore], (_app: FirebaseApp, _afs: AngularFirestore) => {
      app = _app;
      afs = _afs;
    })();
  });

  afterEach(() => {
    app.delete();
  });

  it('should get action updates', async (done: any) => {
    const randomCollectionName = randomName(afs.firestore);
    const ref = afs.firestore.doc(`${randomCollectionName}/FAKE`);
    const stock = new AngularFirestoreDocument<Stock>(ref, afs);
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
    const stock = new AngularFirestoreDocument<Stock>(ref, afs);
    await stock.set(FAKE_STOCK_DATA);
    const obs$ = stock.valueChanges();
    obs$.pipe(take(1)).subscribe(async data => {
      expect(data).toEqual(FAKE_STOCK_DATA);
      stock.delete().then(done).catch(done.fail);
    });
  });

});
