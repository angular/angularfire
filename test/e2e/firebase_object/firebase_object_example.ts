import {Component, enableProdMode, Inject, provide} from 'angular2/core';
import {bootstrap} from 'angular2/platform/browser';
import {defaultFirebase, AngularFire, FIREBASE_PROVIDERS, FirebaseObjectObservable} from 'angularfire2';

import * as Firebase from 'firebase';

enableProdMode();

const rootFirebase = 'ws://localhost.firebaseio.test:5000/';

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
  constructor(public af:AngularFire) {
    var ref = new Firebase(rootFirebase);
    ref.remove();
    this.question = af.object('/questions/1');
    ref.child('/questions/1').set({title: 'how to firebase?'});
  }
}

bootstrap(App, [
  FIREBASE_PROVIDERS,
  defaultFirebase(rootFirebase)]).then(() => {
    console.log('bootstrap success');
  }, (e:any) => {
    console.error('bootstrap failed', e);
  });
