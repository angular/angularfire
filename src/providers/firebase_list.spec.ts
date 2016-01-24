import {Component, Inject, OnInit, ViewChild, provide} from 'angular2/core';

import {fakeAsync, beforeEach, fit, inject, it, describe, expect, TestComponentBuilder} from 'angular2/testing';
import {Observable} from 'rxjs';
import {VirtualTimeScheduler} from 'rxjs/scheduler/VirtualTimeScheduler';
import * as Firebase from 'firebase';

import {FirebaseList, onChildAdded, onChildMoved} from './firebase_list';
import {DEFAULT_FIREBASE} from '../angularfire';

class Todo {
  done:boolean;
}

@Component({
  template: '<h1>Hi</h1>',
  inputs:[],
  providers: [
    FirebaseList({
      token: 'posts',
      path: '/posts'
    }),
    FirebaseList({
      token: Todo,
      path: '/todos'
    }),
    provide(DEFAULT_FIREBASE, {
      useValue: 'ws://test.firebaseio.com'
    })
  ]
})
class MyComponent {
  constructor(
    @Inject('posts') public posts:Observable<any>,
    @Inject(Todo) public todos:Observable<Todo>) {
  }
}


describe('FirebaseList', () => {
  afterEach(() => {
    var fb = new Firebase('ws://test.firebaseio.com');
    fb.remove();
  });

  it('should assign an Observable to the designated parameters', inject([TestComponentBuilder], (tcb:TestComponentBuilder) => {
    tcb.createAsync(MyComponent)
      .then(f => {
        f.detectChanges();
        expect(f.componentInstance.posts instanceof Observable).toBe(true);
        expect(f.componentInstance.todos instanceof Observable).toBe(true);
      });
  }));


  describe('onChildAdded', () => {
    it('should add the child to the end of the array', () => {
      expect(onChildAdded([1], 2)).toEqual([1,2]);
    });


    it('should not mutate the input array', () => {
      var inputArr = [1];
      expect(onChildAdded(inputArr, 2)).not.toEqual(inputArr);
    });
  });


  describe('onChildMoved', () => {
    var val1:any;
    var val2:any;
    var val3:any;
    beforeEach(() => {
      val1 = {key:() => 'key1'};
      val2 = {key:() => 'key2'};
      val3 = {key:() => 'key3'};
    });


    it('should move the child after the specified prevKey', () => {
      expect(onChildMoved([val1, val2], val1, 'key2')).toEqual([val2, val1]);
    });


    it('should move the child to the beginning if prevKey is null', () => {
      expect(
        onChildMoved([val1, val2, val3], val2, null)
      ).toEqual([val2, val1, val3]);
    });


    it('should not mutate the input array', () => {
      var inputArr = [val1, val2];
      expect(onChildMoved(inputArr, val1, 'key2')).not.toEqual(inputArr);
    });
  });
});
