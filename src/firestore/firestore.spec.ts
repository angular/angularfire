import { FirebaseApp, FirebaseAppConfig, AngularFireModule} from 'angularfire2';
import { AngularFirestore, AngularFirestoreModule } from 'angularfire2/firestore';
import * as firebase from 'firebase/app';

import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';

fdescribe('AngularFirestore', () => {
  let app: firebase.app.App;
  let afs: AngularFirestore;

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

  afterEach(done => {
    app.delete().then(done, done.fail);
    // ref.off();
    // ref.remove(done);
  });

  describe('AngularFirestore', () => {

    // document
    it('should have an initialized Firebase app', () => {
      expect(afs.app).toBeDefined();
    });

  });

});