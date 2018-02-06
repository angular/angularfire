import { FirebaseApp } from '@firebase/app-types';
import { FirebaseAppConfig, AngularFireModule} from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule } from 'angularfire2/database';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';

// generate random string to test fidelity of naming
const FIREBASE_APP_NAME = (Math.random() + 1).toString(36).substring(7);

describe('AngularFireDatabase', () => {
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

  describe('<constructor>', () => {

    it('should be an AngularFireDatabase type', () => {
      expect(db instanceof AngularFireDatabase).toEqual(true);
    });

    it('should accept a Firebase App in the constructor', () => {
      const __db = new AngularFireDatabase(app.options, app.name, null!);
      expect(__db instanceof AngularFireDatabase).toEqual(true);
    });

    it('should have an initialized Firebase app instance member', () => {
      expect(db.database.app.name).toEqual(FIREBASE_APP_NAME);
    });

    it('should have an initialized Firebase database instance member', () => {
      expect(db.database.app.name).toEqual(FIREBASE_APP_NAME);
    });
  });

});
