import {Component, Inject, provide} from 'angular2/core';
import {bootstrap} from 'angular2/platform/browser';
import {DEFAULT_FIREBASE, FirebaseList, FirebaseObservable} from 'angularfire2';
// var Firebase = require('firebase');
import Firebase from 'firebase';
const rootFirebase = 'https://answers-mobile.firebaseio.com/';

var ref = new Firebase(rootFirebase);
ref.child('questions').set([{
  question: 'why?'
},{
  question: 'how?'
}]);
@Component({
  template: `
    <h1>Hello</h1>
    <div *ngFor="#question of questions | async">
      {{question.val().question}}
    </div>
  `,
  selector: 'app',
  providers: [FirebaseList('/questions')]
})
class App {
  constructor(@Inject('/questions') public questions:FirebaseObservable<any>) {
  }
}

bootstrap(App, [
  provide(DEFAULT_FIREBASE, {
    useValue: rootFirebase
  })]);
