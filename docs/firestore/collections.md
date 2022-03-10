# 3. Collections in AngularFirestore

#### <p style="color:#16ab45"> This documentation is updated for modular version 9 of angular fire package. For previous or missing features refer to older docs.</p>

> Cloud Firestore is a NoSQL, document-oriented database. Unlike a SQL database, there are no tables or rows. Instead, you store data in _documents_, which are organized into _collections_.
> Each _document_ contains a set of key-value pairs. Cloud Firestore is optimized for storing large collections of small documents.

## Using `AngularFirestoreCollection`

The `AngularFirestoreCollection` service is a wrapper around the native Firestore SDK's [`CollectionReference`](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference) and [`Query`](https://firebase.google.com/docs/reference/js/firebase.firestore.Query) types. It is a generic service that provides you with a strongly typed set of methods for manipulating and streaming data. This service is designed for use as an `@Injectable()`.

```ts
import { Component } from "@angular/core";
import { Subscription } from "rxjs";
import { collection, getDocs, QuerySnapshot } from "firebase/firestore";
import { Firestore } from "@angular/fire/firestore";
export interface Item {
  name: string;
}

@Component({
  selector: "app-root",
  template: `
    <ul>
      <li *ngFor="let item of items">
        {{ item.name }}
      </li>
    </ul>
  `,
})
export class AppComponent implements OnInit {
  items: Item[] = [];
  constructor(private firestore: Firestore) {}
  ngOnInit() {
    getDocs(collection(this.firestore, "data")).then(
      (querySnapshot: QuerySnapshot) => {
        this.items = [];
        querySnapshot.forEach((doc: any) => {
          this.items.push(doc.data());
        });
      }
    );
  }
}
```

## Streaming collection data or get realtime data

There are multiple ways of streaming collection data from Firestore.

1. `collectionSnapshots()` It is a method which returns a subscription with latest and complete list of documents in a collection.
2. `collectionChanges()` It is a method which returns a subscription with only the changed data in a collection.

## `collectionSnapshots()` Implementation example

```typescript
import { Component } from "@angular/core";
import { Subscription } from "rxjs";
import { collection } from "firebase/firestore";
import { collectionSnapshots, Firestore } from "@angular/fire/firestore";
export interface Item {
  name: string;
}

@Component({
  selector: "app-root",
  template: `
    <ul>
      <li *ngFor="let item of items">
        {{ item.name }}
      </li>
    </ul>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  itemListSubscription: Subscription = Subscription.EMPTY;
  items: Item[] = [];
  constructor(private firestore: Firestore) {}
  ngOnInit() {
    this.dataListSubscription = collectionSnapshots(
      collection(this.firestore, "data")
    ).subscribe((data) => {
      this.items = [];
      data.forEach((doc: any) => {
        this.items.push(doc.data());
      });
    });
  }
  ngOnDestroy(): void {
    this.itemListSubscription.unsubscribe();
  }
}
```

## `collectionChanges()` Implementation example

This method only returns data of a changed document so it can be used for keeping an eye on edits on any dataset. This is good method because you don't have to compare all data on the fly to know which one is new.

> Cool tip: It has the best use case when showing notifications. But remember

> <p style="color:#ff4f67;"> <strong>WARNING:</strong> It outputs every document last change present in the collection when it is first invoked or executed. </p>

```typescript
import { Component } from "@angular/core";
import { Subscription } from "rxjs";
import { collection } from "firebase/firestore";
import { collectionChanges, Firestore } from "@angular/fire/firestore";
export interface Item {
  name: string;
}

@Component({
  selector: "app-root",
  template: `
    <ul>
      <li *ngFor="let item of items">
        {{ item.doc.data().name }}
        <strong>Type: </strong>{{ item.type }} <strong>New Index: </strong
        >{{ item.newIndex }} <strong>Old Index: </strong>{{ item.oldIndex }}
      </li>
    </ul>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  itemListSubscription: Subscription = Subscription.EMPTY;
  items: Item[] = [];
  constructor(private firestore: Firestore) {}
  ngOnInit() {
    this.dataListSubscription = collectionChanges(
      collection(this.firestore, "data")
    ).subscribe((dataChange) => {
      this.items = [];
      dataChange.forEach((doc: any) => {
        this.items.push(doc.data());
      });
    });
  }
  ngOnDestroy(): void {
    this.itemListSubscription.unsubscribe();
  }
}
```

## Conditional collection querying

Cloud Firestore provides powerful query functionality for specifying which documents you want to retrieve from a collection or collection group. These queries can also be used with either `getDocs()` or `collectionSnapshots()`, as described in Get Data and Get Realtime Updates.

[More on queries refer here](https://firebase.google.com/docs/firestore/query-data/queries)

#### Simple example demonstrating functioning of queries.

```typescript
import { Component } from "@angular/core";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Firestore } from "@angular/fire/firestore";
export interface Item {
  name: string;
  salary:number;
}

@Component({
  selector: "app-root",
  template: `
    <ul>
      <li *ngFor="let item of items">
        {{ item.name }}
      </li>
    </ul>
  `,
})
export class AppComponent implements OnInit {
  items: Item[] = [];
  constructor(private firestore: Firestore) {}
  ngOnInit() {
    getDocs(
      query(
        collection(this.firestore,'data'),
        where('salary', '>=', 400))).then(collections:any)=>{
        collections.forEach((doc:any)=>{
         this.items.push(doc.data())
        })
    })
  }
}
```
The where() method takes three parameters: a field to filter on, a comparison operator, and a value. Cloud Firestore supports the following comparison operators:

* `<` less than
* `<=` less than or equal to
* `==` equal to
* `\>` greater than
* `\>=` greater than or equal to
* `!=` not equal to
* `array-contains`
* `array-contains-any`
* `in`
* `not-in`


[Looking for more advanced queries](https://firebase.google.com/docs/firestore/query-data/queries#query_operators)

---
## Order and limit data with Cloud Firestore

Cloud Firestore provides powerful query functionality for specifying which documents you want to retrieve from a collection. These queries can also be used with either `getDocs()` or `collectionChanges()`, as described in Get Data.

### Order and limit data
By default, a query retrieves all documents that satisfy the query in ascending order by document ID. You can specify the sort order for your data using orderBy(), and you can limit the number of documents retrieved using limit().

For example, you could query for the first 3 cities alphabetically with:

```typescript
import { Component } from "@angular/core";
import { collection, getDocs, query, limit, where } from "firebase/firestore";
import { Firestore } from "@angular/fire/firestore";
export interface City {
  name: string;
}

@Component({
  selector: "app-root",
  template: `
    <ul>
      <li *ngFor="let city of cities">
        {{ city.name }}
      </li>
    </ul>
  `,
})
export class AppComponent implements OnInit {
  cities: City[] = [];
  constructor(private firestore: Firestore) {}
  ngOnInit() {
    getDocs(
      query(
        collection(this.firestore,'cities'),
        orderBy('name'),
        limit(10))).then((collections:any)=>{
          collections.forEach((doc:any)=>{
            console.log('Conditional',doc.data())
            this.cities.push(doc.data())
          })
    })
  }
}
```

[For more references and extra options visit full docs](https://firebase.google.com/docs/firestore/query-data/order-limit-data)

## Paginate data with query cursors
With query cursors in Cloud Firestore, you can split data returned by a query into batches according to the parameters you define in your query.

Query cursors define the start and end points for a query, allowing you to:

* Return a subset of the data.
* Paginate query results.

However, to define a specific range for a query, you should use the `where()` method described in Simple Queries.

### Add a simple cursor to a query

Use the `startAt()` or `startAfter()` methods to define the start point for a query. The `startAt()` method includes the start point, while the `startAfter()` method excludes it.

For example, if you use `startAt(A)` in a query, it returns the entire alphabet. If you use `startAfter(A)` instead, it returns `B-Z`.

```typescript
import { Component } from "@angular/core";
import { collection, getDocs, query, limit, where } from "firebase/firestore";
import { Firestore } from "@angular/fire/firestore";
export interface City {
  name: string;
  population:number;
}

@Component({
  selector: "app-root",
  template: `
    <ul>
      <li *ngFor="let city of cities">
        {{ city.name }}
      </li>
    </ul>
  `,
})
export class AppComponent implements OnInit {
  cities: City[] = [];
  constructor(private firestore: Firestore) {}
  ngOnInit() {
    getDocs(
      query(
        collection(this.firestore,'population'),
        orderBy("population"),
        startAt(1000000))).then((collections:any)=>{
          collections.forEach((doc:any)=>{
            this.cities.push(doc.data())
        })
    })
  }
}
```

> Now to paginate this query. You just need to get the length of current cities length(-1) and then use it inside `startAfter` function so that all the results will be after the last document

[Full example on pagination](https://firebase.google.com/docs/firestore/query-data/query-cursors#paginate_a_query)


## Manipulating individual documents

To retrieve, update, or delete an individual document you can use the `doc()` method. This method returns an `AngularFirestoreDocument`, which provides methods for streaming, updating, and deleting. [See Using Documents with AngularFirestore for more information on how to use documents](documents.md).

### [Next Step: Querying Collections in AngularFirestore](querying-collections.md)
