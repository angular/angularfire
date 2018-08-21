# 4. Querying lists

## Creating a query with primitive/scalar values

Queries are created by building on the [`firebase.database.Reference`](https://firebase.google.com/docs/reference/js/firebase.database.Reference).

```ts
db.list('/items', ref => ref.orderByChild('size').equalTo('large'))
```

### Query options

| Method   | Purpose            |
| ---------|--------------------|
| `orderByChild` | Specify a child to order by. |
| `orderByKey` | Boolean to order by Firebase Database keys. |
| `orderByValue` | Specify a value to order by. |
| ~~`orderByPriority`~~<sup>1</sup> | Boolean to order by Firebase Database priority.|
| `equalTo`<sup>2</sup> | Limit list to items that contain certain value. |
| `limitToFirst` | Sets the maximum number of items to return from the beginning of the ordered list of results. |
| `limitToLast` | Sets the maximum number of items to return from the end of the ordered list of results. |
| `startAt`<sup>2</sup> | Return items greater than or equal to the specified key or value, depending on the order-by method chosen. |
| `endAt`<sup>2</sup> | Return items less than or equal to the specified key or value, depending on the order-by method chosen. |

<sup>1</sup> [This is the old way of doing things and is no longer recommended for use](https://youtu.be/3WTQZV5-roY?t=3m). Anything you can achieve with `orderByPriority` you should be doing with `orderByChild`.

<sup>2</sup> The Firebase SDK supports an optional `key` parameter for [`startAt`](https://firebase.google.com/docs/reference/js/firebase.database.Reference#startAt), [`endAt`](https://firebase.google.com/docs/reference/js/firebase.database.Reference#endAt), and [`equalTo`](https://firebase.google.com/docs/reference/js/firebase.database.Reference#equalTo) when ordering by child, value, or priority. You can specify the `key` parameter using an object literal that contains the `value` and the `key`. For example: `startAt: { value: 'some-value', key: 'some-key' }`.

To learn more about how sorting and ordering data works in Firebase, check out the Firebase documentation on [working with lists of data](https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data).

## Invalid query combinations

**Queries can only be ordered by one method.** This means you can only specify
`orderByChild`, `orderByKey`, `orderByPriority`, or `orderByValue`.

```ts
// WARNING: Do not copy and paste. This will not work!
ref.orderByChild('size').equalTo('large').orderByKey(true)
```

You can only use `limitToFirst` or `limitToLast`, but not both in combination.

```ts
// WARNING: Do not copy and paste. This will not work!
ref.limitToFirst(10).limitToLast(100)
```

## Dynamic querying

To enable dynamic queries one should lean on RxJS Operators like `switchMap`.

An RxJS Subject is imported below. A Subject is like an Observable, but can multicast to many Observers. Subjects are like EventEmitters: they maintain a registry of many listeners. See, [What is a Subject](http://reactivex.io/rxjs/manual/overview.html#subject) for more information.

When we call [`switchMap` on the Subject](https://www.learnrxjs.io/operators/transformation/switchmap.html), we can map each value to a new Observable; in this case a database query.

```ts
const size$ = new Subject<string>();
const queryObservable = size$.pipe(
  switchMap(size => 
    db.list('/items', ref => ref.orderByChild('size').equalTo(size)).valueChanges()
  )
);

// subscribe to changes
queryObservable.subscribe(queriedItems => {
  console.log(queriedItems);  
});

// trigger the query
size$.next('large');

// re-trigger the query!!!
size$.next('small');
```

**Example app:**
 
[See this example in action on StackBlitz](https://stackblitz.com/edit/angularfire-db-api-s8ip7m).

```ts
import { Component } from '@angular/core';
import { AngularFireDatabase, AngularFireAction } from 'angularfire2/database';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { switchMap } 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
  <h1>Firebase widgets!</h1>
  <div *ngIf="items$ | async; let items; else loading">
    <ul>
      <li *ngFor="let item of items">
        {{ item.payload.val().text }}
        <code>{{ item.payload.key }}</code>
      </li>
    </ul>
    <div *ngIf="items.length === 0">No results, try clearing filters</div>
  </div>
  <ng-template #loading>Loading&hellip;</ng-template>
  <div>
    <h4>Filter by size</h4>
    <button (click)="filterBy('small')">Small</button>
    <button (click)="filterBy('medium')">Medium</button>
    <button (click)="filterBy('large')">Large</button>
    <button (click)="filterBy('x-large')">Extra Large</button>
    <button (click)="filterBy(null)" *ngIf="this.size$.getValue()">
      <em>clear filter</em>
    </button>
  </div>
  `,
})
export class AppComponent {
  items$: Observable<AngularFireAction<firebase.database.DataSnapshot>[]>;
  size$: BehaviorSubject<string|null>;
  
  constructor(db: AngularFireDatabase) {
    this.size$ = new BehaviorSubject(null);
    this.items$ = this.size$.pipe(
      switchMap(size => 
        db.list('/items', ref =>
          size ? ref.orderByChild('size').equalTo(size) : ref
        ).snapshotChanges()
      )
    );
  }
  filterBy(size: string|null) {
    this.size$.next(size);
  }
}
```

**To run the above example as is, you need to have sample data in you firebase database with the following structure:**
 
 ```json
{
  "items": {
    "a" : {
      "size" : "small",
      "text" : "small thing"
    },
    "b" : {
      "size" : "medium",
      "text" : "medium sample"
    },
    "c" : {
      "size" : "large",
      "text" : "large widget"
    }
  }
}
 ```

### [Next Step: Getting started with Firebase Authentication](../auth/getting-started.md)
