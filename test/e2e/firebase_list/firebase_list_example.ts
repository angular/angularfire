import {Component, enableProdMode, Inject, provide} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {defaultFirebase, AngularFire, FIREBASE_PROVIDERS, FirebaseListObservable} from 'angularfire2';
import * as Firebase from 'firebase';

enableProdMode();

const rootFirebase = 'https://angularfire2.firebaseio-demo.com/';

@Component({
  template: `
    <h1>Hello</h1>
    <div *ngFor="#question of questions | async">
      {{question.question}}
    </div>
  `,
  selector: 'app'
})
class App {
  questions:FirebaseListObservable<any>;
  constructor(public af:AngularFire) {
    var ref = new Firebase(rootFirebase);
    ref.remove();
    this.questions = af.list('/questions');
    this.questions.add({question: 'why?'});
    this.questions.add({question: 'how?'});
  }
}

bootstrap(App, [
  FIREBASE_PROVIDERS,
  defaultFirebase(rootFirebase)]).then(() => {
    console.log('bootstrap success');
  }, (e:any) => {
    console.error('bootstrap failed', e);
  });
