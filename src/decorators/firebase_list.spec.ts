import 'zone.js';
import {Component, OnInit, ViewChild} from 'angular2/core';
import {FirebaseList} from './firebase_list';
import {fakeAsync, beforeEach, fit, inject, it, describe, expect, TestComponentBuilder} from 'angular2/testing';
import {Observable} from 'rxjs';
import {VirtualTimeScheduler} from 'rxjs/scheduler/VirtualTimeScheduler';
import * as Firebase from 'firebase';
var FirebaseServer = require('firebase-server');
new FirebaseServer(5000, 'test.firebaseio.com');

import {Parse5DomAdapter} from 'angular2/platform/server';
Parse5DomAdapter.makeCurrent();

@Component({
  template: '<h1>Hi</h1>',
  inputs:[]
})
class MyComponent {
  @FirebaseList({
    path: 'ws://test.firebaseio.com'
  }) foo:any;

  constructor() {
  }
}

@Component({
  template: '<h1>Hi</h1>'
})
class MyComponentWithOnInit implements OnInit {
  @FirebaseList({
    path: 'ws://test.firebaseio.com'
  }) foo:any;
  ngOnInitCalled = false;
  ngOnInit () {
    this.ngOnInitCalled = true;
  }
}

describe('FirebaseList', () => {
  afterEach(() => {
    var fb = new Firebase('ws://test.firebaseio.com');
    fb.remove();
  })
  it('should assign an Observable to the designated property', inject([TestComponentBuilder], (tcb:TestComponentBuilder) => {
    tcb.createAsync(MyComponent)
      .then(f => {
        f.detectChanges();
        expect(f.componentInstance.foo instanceof Observable).toBe(true);
      });
  }));


  it('should should pass the array from the ref', inject([TestComponentBuilder], (tcb:TestComponentBuilder) => {
    tcb.createAsync(MyComponent)
      .then(f => {
        var next = jasmine.createSpy('next');
        f.detectChanges();
        f.componentInstance.foo.subscribe(next);
        f.componentInstance.foo.firebaseRef.push(1);
        f.componentInstance.foo.firebaseRef.push(2);
        expect(next.calls.count()).toBe(2);
      });
  }));


  it('should update the array when a child moves', inject([TestComponentBuilder], (tcb:TestComponentBuilder) => {
    tcb.createAsync(MyComponent)
      .then((f) => {
        var next = jasmine.createSpy('next');
        f.detectChanges();

        f.componentInstance
          .foo
          .subscribe(next);
        var child1 = f.componentInstance.foo.firebaseRef.push(1);

        expect(extractRecentValues(next)).toEqual([1]);
        var child2 = f.componentInstance.foo.firebaseRef.push(2);
        expect(extractRecentValues(next)).toEqual([1,2]);
        child1.setPriority('ZZZZ');
        expect(extractRecentValues(next)).toEqual([2,1]);
      });
  }));
});

function extractRecentValues(spy:jasmine.Spy):any[] {
  return spy.calls.mostRecent().args[0].map((v:any) => v.val());
}