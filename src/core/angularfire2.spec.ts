import { TestBed, inject } from '@angular/core/testing';
import { PlatformRef, NgModule, CompilerFactory } from '@angular/core';
import { FirebaseApp, AngularFireModule } from '@angular/fire';
import { Subscription } from 'rxjs';
import { COMMON_CONFIG } from '../test-config';
import { BrowserModule } from '@angular/platform-browser';
import { database } from 'firebase/app';
import 'firebase/database';

describe('angularfire', () => {
  let subscription:Subscription;
  let app: FirebaseApp;
  let rootRef: database.Reference;
  let questionsRef: database.Reference;
  let listOfQuestionsRef: database.Reference;
  let defaultPlatform: PlatformRef;

  const APP_NAME = 'super-awesome-test-firebase-app-name';

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [AngularFireModule.initializeApp(COMMON_CONFIG, APP_NAME)]
    });

    inject([FirebaseApp, PlatformRef], (_app: FirebaseApp, _platform: PlatformRef) => {
      app = _app;
      rootRef = app.database!().ref();
      questionsRef = rootRef.child('questions');
      listOfQuestionsRef = rootRef.child('list-of-questions');
      defaultPlatform = _platform;
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

    if (typeof window !== 'undefined') {

      it('should have the provided name', () => {
        expect(app.name).toBe(APP_NAME);
      });

      it('should use an already intialized firebase app if it exists', done => {
        @NgModule({
          imports: [
            AngularFireModule.initializeApp(COMMON_CONFIG, APP_NAME),
            BrowserModule
          ]})
        class MyModule {
          ngDoBootstrap() {}
        }

        const compilerFactory: CompilerFactory =
            defaultPlatform.injector.get(CompilerFactory, null);
        const moduleFactory = compilerFactory.createCompiler().compileModuleSync(MyModule);

        defaultPlatform.bootstrapModuleFactory(moduleFactory)
          .then(moduleRef => {
            const ref = moduleRef.injector.get(FirebaseApp);
            expect(ref.name).toEqual(app.name);
          }).then(done, e => {
            fail(e);
            done()
          });
      })

    }
  });
});
