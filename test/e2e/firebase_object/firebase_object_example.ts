import {Component, enableProdMode, Inject, provide} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {
  defaultFirebase,
  AngularFire,
  FIREBASE_PROVIDERS,
  FirebaseObjectObservable,
  FirebaseApp
} from '../../../dist/angularfire2';

// TODO fix imports and tsconfig
// import { COMMON_CONFIG } from '../../../src/test-config';

const COMMON_CONFIG = {
    apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
    authDomain: "angularfire2-test.firebaseapp.com",
    databaseURL: "https://angularfire2-test.firebaseio.com",
    storageBucket: "angularfire2-test.appspot.com",
};


enableProdMode();

@Component({
  template: `
    <h1>
      Question
    </h1>
    {{ (question | async).title }}
  `,
  selector: 'app'
})
class App {
  question:FirebaseObjectObservable<any>;
  constructor(public af:AngularFire, @Inject(FirebaseApp) app: firebase.app.App) {
    var ref = app.database().ref();
    ref.remove();
    this.question = af.database.object('/questions/1');
    ref.child('/questions/1').set({title: 'how to firebase?'});
  }
}

bootstrap(App, [
  defaultFirebase(COMMON_CONFIG),
  FIREBASE_PROVIDERS
])
  .then(() => {
    console.log('bootstrap success');
  }, (e:any) => {
    console.error('bootstrap failed', e);
  });
