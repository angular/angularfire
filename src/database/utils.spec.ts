import * as firebase from 'firebase/app';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule} from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import * as utils from './utils';
import { COMMON_CONFIG } from './test-config';


// generate random string to test fidelity of naming
const FIREBASE_APP_NAME = (Math.random() + 1).toString(36).substring(7);

fdescribe('AngularFireDatabase', () => {
  let app: FirebaseApp;
  let db: AngularFireDatabase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG, FIREBASE_APP_NAME),
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

  describe('utils', () => {

    describe('isString', () => {
      
      it('should be able to properly detect a string', () => {
        const str = 'oh hai';
        const notStr = 101;
        const bool = true;
        const nul = null;
        const obj = {};
        const fn = () => {};
        let undef;
        expect(utils.isString(str)).toBe(true);
        expect(utils.isString(notStr)).toBe(false);
        expect(utils.isString(bool)).toBe(false);
        expect(utils.isString(nul)).toBe(false);
        expect(utils.isString(fn)).toBe(false);
        expect(utils.isString(undef)).toBe(false);
      });

    });

  });

});
