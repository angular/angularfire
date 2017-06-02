import * as firebase from 'firebase/app';
import { TestBed, inject } from '@angular/core/testing';
import { ReflectiveInjector, Provider } from '@angular/core';
import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from './angularfire2';
import { Subscription } from 'rxjs/Subscription';
import { COMMON_CONFIG } from './test-config';

describe('angularfire', () => {
  let subscription:Subscription;
  let app: FirebaseApp;
  let rootRef: firebase.database.Reference;
  let questionsRef: firebase.database.Reference;
  let listOfQuestionsRef: firebase.database.Reference;
  const APP_NAME = 'super-awesome-test-firebase-app-name';

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, APP_NAME)]
    });

    inject([FirebaseApp], (_app: FirebaseApp) => {
      app = _app;
      rootRef = app.database().ref();
      questionsRef = rootRef.child('questions');
      listOfQuestionsRef = rootRef.child('list-of-questions');
    })();

  });

  afterEach((done) => {
    rootRef.remove()
    if(subscription && !subscription.closed) {
      subscription.unsubscribe();
    }
    app.delete().then(done, done.fail);
  });

  describe('FirebaseApp', () => {
    it('should provide a FirebaseApp for the FirebaseApp binding', () => {
      expect(typeof app.delete).toBe('function');
    });
    it('should have the provided name', () => {
      expect(app.name).toBe(APP_NAME);
    })
  });
});
