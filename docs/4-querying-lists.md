# 4. Querying lists

> Querying is a killer feature of AngularFire2. 
You can specify query values as observables, and when those
observables emit new values, the query is automatically re-run.

## Creating a query with primitive/scalar values

Queries are created by specifying a `query` object on the `FirebaseListObservable` options.

```ts
const queryObservable = db.list('/items', {
  query: {
    orderByChild: 'size',
    equalTo: 'large' 
  }
});
```

**Query Options:**

| method   | purpose            | 
| ---------|--------------------| 
| `orderByChild` | Specify a child to order by. |
| `orderByKey` | Boolean to order by Firebase Database keys. |
| `orderByPriority` | Boolean to order by Firebase Database priority. |
| `orderByValue` | Specify a value to order by. |
| `equalTo` <sup>1</sup> | Limit list to items that contain certain value. |
| `limitToFirst` | Sets the maximum number of items to return from the beginning of the ordered list of results. |
| `limitToLast` | Sets the maximum number of items to return from the end of the ordered list of results. |
| `startAt` <sup>1</sup> | Return items greater than or equal to the specified key or value, depending on the order-by method chosen. |
| `endAt` <sup>1</sup> | Return items less than or equal to the specified key or value, depending on the order-by method chosen. |

<sup>1</sup> The Firebase SDK supports an optional `key` parameter for [`startAt`](https://firebase.google.com/docs/reference/js/firebase.database.Reference#startAt), [`endAt`](https://firebase.google.com/docs/reference/js/firebase.database.Reference#endAt), and [`equalTo`](https://firebase.google.com/docs/reference/js/firebase.database.Reference#equalTo) when ordering by child, value, or priority. You can specify the `key` parameter using an object literal that contains the `value` and the `key`. For example: `startAt: { value: 'some-value', key: 'some-key' }`.

## Invalid query combinations

**Queries can only be ordered by one method.** This means you can only specify
`orderByChild`, `orderByKey`, `orderByPriority`, or `orderByValue`.

```ts
// WARNING: Do not copy and paste. This will not work!
const queryObservable = db.list('/items', {
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
const queryObservable = db.list('/items', {
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

An RxJS Subject is imported below. A Subject is like an Observable, but can multicast to many Observers. Subjects are like EventEmitters: they maintain a registry of many listeners. See, [What is a Subject](http://reactivex.io/rxjs/manual/overview.html#subject) for more information.

```ts
const subject = new Subject(); // import {Subject} from 'rxjs/Subject';
const queryObservable = db.list('/items', {
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
import { AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable } from 'angularfire2/database';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-root',
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
export class AppComponent {
  items: FirebaseListObservable<any[]>;
  sizeSubject: Subject<any>;
  
  constructor(db: AngularFireDatabase) {
    this.sizeSubject = new Subject();
    this.items = db.list('/items', {
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

+**To run the above example as is, you need to have sample data in you firebase database with the following structure:"**
 
 ```ts
   -|items
       -|item1
           -|size: small
           -|text: sample small text
       -|item2
           -|size: medium
           -|text: sample medium text
       -|item3
           -|size: large
           -|text: sample large text    
 ```

### [Next Step: User Authentication](5-user-authentication.md)
