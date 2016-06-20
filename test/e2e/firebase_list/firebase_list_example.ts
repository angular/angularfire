import {Component, enableProdMode, Inject, provide} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {
  defaultFirebase,
  AngularFire,
  FIREBASE_PROVIDERS,
  FirebaseListObservable,
  FirebaseApp
} from 'angularfire2';

enableProdMode();

// TODO fix imports and tsconfig
// import { COMMON_CONFIG } from '../../../src/test-config';

const COMMON_CONFIG = {
    apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
    authDomain: "angularfire2-test.firebaseapp.com",
    databaseURL: "https://angularfire2-test.firebaseio.com",
    storageBucket: "angularfire2-test.appspot.com",
};

@Component({
  template: `
    <h1>Hello</h1>
    <div *ngFor="let question of questions | async">
      {{question.question}}
    </div>
  `,
  selector: 'app'
})
class App {
  questions:FirebaseListObservable<any>;
  constructor(public af:AngularFire, @Inject(FirebaseApp) app: firebase.app.App) {
    var ref = app.database().ref();
    ref.remove();
    this.questions = af.database.list('/questions');
    this.questions.push({question: 'why?'});
    this.questions.push({question: 'how?'});
  }
}

bootstrap(App, [
  FIREBASE_PROVIDERS,
  defaultFirebase(COMMON_CONFIG)]).then(() => {
    console.log('bootstrap success');
  }, (e:any) => {
    console.error('bootstrap failed', e);
  });
