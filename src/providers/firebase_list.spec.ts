import {Component, Inject, OnInit, ViewChild, provide} from 'angular2/core';

import {fakeAsync, beforeEach, fit, inject, it, describe, expect, TestComponentBuilder} from 'angular2/testing';
import {Observable} from 'rxjs';
import {VirtualTimeScheduler} from 'rxjs/scheduler/VirtualTimeScheduler';
import * as Firebase from 'firebase';

import {FirebaseList, FirebaseListFactory, onChildAdded, onChildMoved} from './firebase_list';
import {DEFAULT_FIREBASE} from '../angularfire';

class Todo {
  done:boolean;
}

const rootFirebase = 'ws://test.firebaseio.com';

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
      useValue: rootFirebase
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
    var fb = new Firebase(rootFirebase);
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


  describe('FirebaseListFactory', () => {
    it('should emit a new value when a child moves', () => {
      var ref = new Firebase(`${rootFirebase}/questions`);
      var o = FirebaseListFactory(`${rootFirebase}/questions`);
      var nextSpy = jasmine.createSpy('next');
      o.subscribe(nextSpy);
      expect(nextSpy.calls.count()).toBe(0);

      var child1 = ref.push(1);
      expect(nextSpy.calls.count()).toBe(1);

      ref.push(2);
      expect(nextSpy.calls.count()).toBe(2);

      child1.setPriority('ZZZZ');
      expect(nextSpy.calls.count()).toBe(3);
      expect(
        nextSpy.calls.mostRecent().args[0].map((v:any) => v.val())
      ).toEqual([2,1]);
    });
  });



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
