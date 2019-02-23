import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { AngularFirestore, EnableStateTransferToken } from './firestore';
import { AngularFirestoreModule } from './firestore.module';
import { TestBed, inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';
import { BrowserTransferStateModule } from '@angular/platform-browser';

describe('AngularFirestore with state-transfer', () => {
  let app: FirebaseApp;
  let afs: AngularFirestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(COMMON_CONFIG),
        AngularFirestoreModule.enablePersistence(),
        BrowserTransferStateModule
      ],
      providers: [
          { provide: EnableStateTransferToken, useValue: true }
      ]
    });
    inject([FirebaseApp, AngularFirestore], (_app: FirebaseApp, _afs: AngularFirestore) => {
      app = _app;
      afs = _afs;
    })();
  });

  afterEach(async (done) => {
    await app.delete();
    done();
  });

});
