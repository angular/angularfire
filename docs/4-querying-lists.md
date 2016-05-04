# 4. Querying lists

> Querying is a killer feature of AngularFire2. 
You can specify query values as observables, and when those
observables emit new values, the query is automatically re-run.

## Creating a query with primitive/scalar values

Queries are created by specifying a `query` object on the `FirebaseListObservable` options.

```ts
const queryObservable = af.database.list('/items', {
  query: {
    orderByChild: 'size',
    equalTo: 'large' 
  }
});
```

## Invalid query combinations

**Queries can only be ordered by one method.** This means you can only specify
`orderByChild`, `orderByKey`, `orderByPriority`, or `orderByValue`.

```ts
// WARNING: Do not copy and paste. This will not work!
const queryObservable = af.database.list('/items', {
  query: {
    orderByChild: 'size',
    equalTo: 'large',
    orderByKey: true,
  }
});
```

You can only use `limitToFirst` or `limitToLast`, but not both in combination.

```ts
// WARNING: Do not copy and paste. This will not work!
const queryObservable = af.database.list('/items', {
  query: {
    limitToFirst: 10,
    limitToLast: 100,
  }
});
```

## Creating a query with observable values

Rather than specifying regular values, observables can be used to dynamically
re-run queries when the observable emits a new value.

This is the magic of AngularFire2.

```ts
const subject = new Subject(); // import {Subject} from 'rxjs/Subject';
const queryObservable = af.database.list('/items', {
  query: {
    orderByChild: 'size',
    equalTo: subject 
  }
});

// subscribe to changes
queryObservable.subscribe(queriedItems => {
  console.log(queriedItems);  
});

// trigger the query
subject.next('large');

// re-trigger the query!!!
subject.next('small');
```

**Example app:**

```ts
import { Component } from '@angular/core';
import { AngularFire, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2';
import { Subject } from 'rxjs/Subject';

@Component({
  moduleId: module.id,
  selector: 'app',
  template: `
  <ul>
    <li *ngFor="let item of items | async">
      {{ item.text }}
    </li>
  </ul>
  <div>
    <h4>Filter by size</h4>
    <button (click)="filterBy('small')">Small</button>
    <button (click)="filterBy('medium')">Medium</button>
    <button (click)="filterBy('large')">Large</button>
  </div>
  `,
})
export class RcTestAppComponent {
  items: FirebaseListObservable<any[]>;
  sizeSubject: Subject<any>;
  
  constructor(af: AngularFire) {
    this.sizeSubject = new Subject();
    this.items = af.database.list('/items', {
      query: {
        orderByChild: 'size',
        equalTo: this.sizeSubject
      }
    });
  }
  filterBy(size: string) {
    this.sizeSubject.next(size); 
  }
}
```

###[Next Step: User Authentication](5-user-authentication.md)