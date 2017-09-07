import { FirebaseApp, FirebaseAppConfig, AngularFireModule} from 'angularfire2';
import { AngularFirestore, AngularFirestoreModule, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import * as firebase from 'firebase/app';
import * as firestore from 'firestore';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';

interface Stock {
  name: string;
  price: number;
}

const FAKE_STOCK_DATA = { name: 'FAKE', price: 1 };

fdescribe('Firestore', () => {
  let app: firebase.app.App;
  let afs: AngularFirestore;
  let stock: AngularFirestoreDocument<Stock>;
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
      stock = afs.doc('stocks/FAKE');
    })();
  });

  afterEach(async (done) => {
    await app.delete();
    //await stock.delete();
    if(sub) {
      sub.unsubscribe();
    }
    done();
  });

  describe('AngularFirestore', () => {

    it('should be the properly initialized type', () => {
      expect(afs instanceof AngularFirestore).toBe(true);
    });

    it('should have an initialized Firebase app', () => {
      expect(afs.app).toBeDefined();
    });

    describe('AngularFirestore#document', () => {

      it('should throw on an invalid path', () => {
        const singleWrapper = () => afs.doc('collection');
        const tripleWrapper = () => afs.doc('collection/doc/subcollection');
        expect(singleWrapper).toThrowError();
        expect(tripleWrapper).toThrowError();
      });

      it('should get data as an Observable', async(done: any) => {
        //await stock.set(FAKE_STOCK_DATA);
        const obs$ = Observable.from(stock);
        obs$.catch(e => { console.log(e); return e; })
          .take(1) // this will unsubscribe after the first
          .subscribe(async (data: Stock) => {
            debugger;
            expect(JSON.stringify(data)).toBe(JSON.stringify(FAKE_STOCK_DATA));
            stock.delete().then(done).catch(done.fail);
          });
      });

      it('should get realtime updates', async(done: Function) => {
        // pick a new stock
        //await stock.set(FAKE_STOCK_DATA);
        sub = stock
          .valueChanges()
          .subscribe(async a => {
            debugger;
            if(a.exists) {
              expect(a.data()).toEqual(FAKE_STOCK_DATA);
              await stock.delete();
              done();
            }
          });
      });

    });

  });

});