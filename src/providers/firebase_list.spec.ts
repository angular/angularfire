import {Component, Inject, OnInit, ViewChild, enableProdMode, provide} from 'angular2/core';
import {AsyncPipe, NgFor} from 'angular2/common';

import {beforeEach, fit, inject, it, describe, expect, TestComponentBuilder} from 'angular2/testing';
import * as Firebase from 'firebase';

import {FirebaseList} from './firebase_list';

import {FirebaseUrl, FirebaseObservable} from '../angularfire';

enableProdMode();

class Todo {
  done:boolean;
}

const rootFirebase = 'ws://test.firebaseio.com:5000';

const sharedTemplate = `
  <h1>Todos</h1>
  <div *ngFor="#todo of todos | async" class="todo">
    {{todo.val().title}}
  </div>
  <h1>Posts</h1>
  <div *ngFor="#post of posts | async" class="post">
    {{post.val().title}}
  </div>
`;

@Component({
  template: sharedTemplate,
  inputs:[],
  directives: [NgFor],
  pipes: [AsyncPipe],
  providers: [
    FirebaseList({
      token: 'posts',
      path: '/posts'
    }),
    FirebaseList({
      token: Todo,
      path: '/todos'
    }),
    provide(FirebaseUrl, {
      useValue: rootFirebase
    })
  ]
})
class MyComponent {
  constructor(
    @Inject('posts') public posts:FirebaseObservable<any>,
    @Inject(Todo) public todos:FirebaseObservable<any>) {}
}

@Component({
  template: sharedTemplate,
  inputs:[],
  directives: [NgFor],
  pipes: [AsyncPipe],
  providers: [
    FirebaseList('/posts'),
    FirebaseList('/todos'),
    provide(FirebaseUrl, {
      useValue: rootFirebase
    })
  ]
})
class MyComponentStringArg {
  constructor(
    @Inject('/posts') public posts:FirebaseObservable<any>,
    @Inject('/todos') public todos:FirebaseObservable<any>) {}
}


describe('FirebaseList', () => {
  beforeEach(() => {
    var fb = new Firebase(rootFirebase);
    fb.remove();
  });

  it('should assign an Observable to the designated parameters', inject([TestComponentBuilder], (tcb:TestComponentBuilder) => {
    tcb.createAsync(MyComponent)
      .then(f => {
        var ref = new Firebase(rootFirebase);
        ref.child('todos').push({
          title: 'write post about angular 2'
        });
        ref.child('posts').push({
          title: 'Angular 2 Beta'
        });
        f.detectChanges();
        expect(f.componentInstance.posts instanceof FirebaseObservable).toBe(true);
        expect(f.componentInstance.todos instanceof FirebaseObservable).toBe(true);

        var todoRows = f.nativeElement.querySelectorAll('div.todo');
        expect(todoRows.length).toBe(1);

        var postRows = f.nativeElement.querySelectorAll('div.post');
        expect(postRows.length).toBe(1);
      });
  }));


  it('should accept a single string as path and token', inject([TestComponentBuilder], (tcb:TestComponentBuilder) => {
    tcb.createAsync(MyComponent)
      .then(f => {
        var ref = new Firebase(rootFirebase);
        ref.child('todos').push({
          title: 'write post about angular 2'
        });
        ref.child('posts').push({
          title: 'Angular 2 Beta'
        });
        f.detectChanges();
        expect(f.componentInstance.posts instanceof FirebaseObservable).toBe(true);
        expect(f.componentInstance.todos instanceof FirebaseObservable).toBe(true);

        var todoRows = f.nativeElement.querySelectorAll('div.todo');
        expect(todoRows.length).toBe(1);

        var postRows = f.nativeElement.querySelectorAll('div.post');
        expect(postRows.length).toBe(1);
      });
  }));
  
});
