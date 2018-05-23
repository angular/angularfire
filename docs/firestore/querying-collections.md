# 4. Querying Collections in AngularFirestore

> Firestore has [powerful querying syntax](https://firebase.google.com/docs/firestore/query-data/queries) and the [`AngularFirestoreCollection`](../reference/classes/angularfirestorecollection.md) provides a thin wrapper around it. This keeps you from having to learn two query syntax systems.
If you know the [Firestore query API](https://firebase.google.com/docs/reference/js/firebase.firestore.Query) then you know how to query in AngularFirestore.

## Creating a query with primitive/scalar values

Queries are created by building on the [`firebase.firestore.Reference`](https://firebase.google.com/docs/reference/js/firebase.firestore.Reference).

```ts
afs.collection('items', ref => ref.where('size', '==', 'large'))
```

**Query Options:**

| method   | purpose            |
| ---------|--------------------|
| `where` | Create a new query. *Can be chained to form complex queries.* |
| `orderBy` | Sort by the specified field, in descending or ascending order. |
| `limit` | Sets the maximum number of items to return. |
| `startAt` | Results start at the provided document (inclusive). |
| `startAfter` | Results start after the provided document (exclusive). |
| `endAt` | Results end at the provided document (inclusive). |
| `endBefore` | Results end before the provided document (exclusive). |

[To learn more about querying and sorting in Firestore, check out the Firebase documentation](https://firebase.google.com/docs/firestore/query-data/queries).

## Invalid query combinations

Range filters can only be specified on a single field:

```ts
// WARNING: Do not copy and paste. This will not work!
ref.where('state', '>=', 'CA')
   .where('population', '>', 100000)
```

Range filter and orderBy cannot be on different fields:

```ts
// WARNING: Do not copy and paste. This will not work!
ref.where('population', '>', 100000).orderBy('country')
```

Range filters / orderBy cannot be used in conjuction with user-defined data, they require composite indexes be defined on the specific fields.

```ts
// WARNING: Do not copy and paste. This will not work!
ref.where('tags.awesome', '==', true).orderBy('population')
```

## Dynamic querying

To enable dynamic queries one should lean on RxJS Operators like `switchMap`.

An RxJS Subject is imported below. A Subject is like an Observable, but can multicast to many Observers. Subjects are like EventEmitters: they maintain a registry of many listeners. See, [What is a Subject](http://reactivex.io/rxjs/manual/overview.html#subject) for more information.

When we call [`switchMap` on the Subject](https://www.learnrxjs.io/operators/transformation/switchmap.html), we can map each value to a new Observable; in this case a database query.

```ts
const size$ = new Subject<string>();
const queryObservable = size$.pipe(
  switchMap(size => 
    afs.collection('items', ref => ref.where('size', '==', size)).valueChanges()
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
 
[See this example in action on StackBlitz](https://stackblitz.com/edit/angularfire-db-api-fbad9p).

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface Item {
  text: string;
  color: string;
  size: string;
}

@Component({
  selector: 'app-root',
  template: `
  <div *ngIf="items$ | async; let items; else loading">
    <ul>
      <li *ngFor="let item of items">
        {{ item.text }}
      </li>
    </ul>
    <div *ngIf="items.length === 0">No results, try clearing filters</div>
  </div>
  <ng-template #loading>Loading&hellip;</ng-template>
  <div>
    <h4>Filter by size</h4>
    <button (click)="filterBySize('small')">Small</button>
    <button (click)="filterBySize('medium')">Medium</button>
    <button (click)="filterBySize('large')">Large</button>
    <button (click)="filterBySize(null)" *ngIf="this.sizeFilter$.getValue()">
      <em>clear filter</em>
    </button>
  </div>
  <div>
    <h4>Filter by color</h4>
    <button (click)="filterByColor('red')">Red</button>
    <button (click)="filterByColor('green')">Blue</button>
    <button (click)="filterByColor('blue')">Green</button>
    <button (click)="filterByColor(null)" *ngIf="this.colorFilter$.getValue()">
      <em>clear filter</em>
    </button>
  </div>
  `,
})
export class AppComponent {
  items$: Observable<Item[]>;
  sizeFilter$: BehaviorSubject<string|null>;
  colorFilter$: BehaviorSubject<string|null>;
  
  constructor(afs: AngularFirestore) {
    this.sizeFilter$ = new BehaviorSubject(null);
    this.colorFilter$ = new BehaviorSubject(null);
    this.items$ = combineLatest(
      this.sizeFilter$,
      this.colorFilter$
    ).pipe(
      switchMap(([size, color]) => 
        afs.collection('items', ref => {
          let query : firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
          if (size) { query = query.where('size', '==', size) };
          if (color) { query = query.where('color', '==', color) };
          return query;
        }).valueChanges()
      )
    );
  }
  filterBySize(size: string|null) {
    this.sizeFilter$.next(size); 
  }
  filterByColor(color: string|null) {
    this.colorFilter$.next(color); 
  }
}
```

**To run the above example as is, you need to have sample data in you firebase database with the following structure:**
 
 ```json
{
  "items": {
    "a" : {
      "size"  : "small",
      "text"  : "small thing",
      "color" : "red"
    },
    "b" : {
      "size"  : "medium",
      "text"  : "medium sample",
      "color" : "red"
    },
    "c" : {
      "size"  : "large",
      "text"  : "large widget",
      "color" : "green"
    }
  }
}
 ```

### [Next Step: Getting started with Firebase Authentication](../auth/getting-started.md)
