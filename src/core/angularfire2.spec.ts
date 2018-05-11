
import { Reference } from '@firebase/database-types';
import { TestBed, inject, withModule, async } from '@angular/core/testing';
import { ReflectiveInjector, Provider, PlatformRef, NgModule, Compiler, ApplicationRef, CompilerFactory } from '@angular/core';
import { FirebaseAppConfigToken, AngularFireModule } from 'angularfire2';
import { Subscription } from 'rxjs/Subscription';
import { COMMON_CONFIG } from './test-config';
import { BrowserModule } from '@angular/platform-browser';
import { FirebaseApp } from '@firebase/app-types';

describe('angularfire', () => {
  let subscription:Subscription;
  let app: FirebaseApp;
  let rootRef: Reference;
  let questionsRef: Reference;
  let listOfQuestionsRef: Reference;
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
    it('should have the provided name', () => {
      expect(app.name).toBe(APP_NAME);
    })
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
  });
});
