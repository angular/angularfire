# 3. Collections in AngularFirestore

> Cloud Firestore is a NoSQL, document-oriented database. Unlike a SQL database, there are no tables or rows. Instead, you store data in *documents*, which are organized into *collections*.
Each *document* contains a set of key-value pairs. Cloud Firestore is optimized for storing large collections of small documents.

## Using `AngularFirestoreCollection`

The `AngularFirestoreCollection` service is a wrapper around the native Firestore SDK's [`CollectionReference`](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference) and [`Query`](https://firebase.google.com/docs/reference/js/firebase.firestore.Query) types. It is a generic service that provides you with a strongly typed set of methods for manipulating and streaming data. This service is designed for use as an `@Injectable()`.

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Item { name: string; }

@Component({
  selector: 'app-root',
  template: `
    <ul>
      <li *ngFor="let item of items | async">
        {{ item.name }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>;
  items: Observable<Item[]>;
  constructor(private afs: AngularFirestore) {
    this.itemsCollection = afs.collection<Item>('items');
    this.items = this.itemsCollection.valueChanges();
  }
  addItem(item: Item) {
    this.itemsCollection.add(item);
  }
}
```

The `AngularFirestoreCollection` is a service you use to create streams of the collection and perform data operations on the underyling collection.

### The `DocumentChangeAction` type

With the exception of the `valueChanges()`, each streaming method returns an Observable of `DocumentChangeAction[]`.

A `DocumentChangeAction` gives you the `type` and `payload` properties. The `type` tells when what `DocumentChangeType` operation occured (`added`, `modified`, `removed`). The `payload` property is a `DocumentChange` which provides you important metadata about the change and a `doc` property which is the `DocumentSnapshot`.

```ts
interface DocumentChangeAction {
  //'added' | 'modified' | 'removed';
  type: DocumentChangeType;
  payload: DocumentChange;
}

interface DocumentChange {
  type: DocumentChangeType;
  doc: DocumentSnapshot;
  oldIndex: number;
  newIndex: number;
}

interface DocumentSnapshot {
  exists: boolean;
  ref: DocumentReference;
  id: string;
  metadata: SnapshotMetadata;
  data(): DocumentData;
  get(fieldPath: string): any;
}
```

## Streaming collection data

There are multiple ways of streaming collection data from Firestore. 

### `valueChanges({idField?: string})`

**What is it?** - The current state of your collection. Returns an Observable of data as a synchronized array of JSON objects. All Snapshot metadata is stripped and just the document data is included. Optionally, you can pass an options object with an `idField` key containing a string. If provided, the returned JSON objects will include their document ID mapped to a property with the name provided by `idField`.  

**Why would you use it?** - When you just need a list of data. No document metadata is attached to the resulting array which makes it simple to render to a view.

**When would you not use it?** - When you need a more complex data structure than an array.

**Best practices** - Use this method to display data on a page. It's simple but effective. Use `.snapshotChanges()` once your needs become more complex.

#### Example of persisting a Document Id

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Item { id: string; name: string; }

@Component({
  selector: 'app-root',
  template: `
    <ul>
      <li *ngFor="let item of items | async">
        {{ item.name }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>;
  items: Observable<Item[]>;
  constructor(private readonly afs: AngularFirestore) {
    this.itemsCollection = afs.collection<Item>('items');
    // .valueChanges() is simple. It just returns the 
    // JSON data without metadata. If you need the 
    // doc.id() in the value you must persist it your self
    // or use .snapshotChanges() instead. See the addItem()
    // method below for how to persist the id with
    // valueChanges()
    this.items = this.itemsCollection.valueChanges();
  }
  addItem(name: string) {
    // Persist a document id
    const id = this.afs.createId();
    const item: Item = { id, name };
    this.itemsCollection.doc(id).set(item);
  }
}
```

### `snapshotChanges()`

**What is it?** - The current state of your collection. Returns an Observable of data as a synchronized array of `DocumentChangeAction[]`. 

**Why would you use it?** - When you need a list of data but also want to keep around metadata. Metadata provides you the underyling `DocumentReference`, document id, and array index of the single document. Having the document's id around makes it easier to use data manipulation methods. This method gives you more horsepower with other Angular integrations such as ngrx, forms, and animations due to the `type` property. The `type` property on each `DocumentChangeAction` is useful for ngrx reducers, form states, and animation states.

**When would you not use it?** - When you need a more complex data structure than an array or if you need to process changes as they occur. This array is synchronized with the remote and local changes in Firestore.

**Best practices** - Use an observable operator to transform your data from `.snapshotChanges()`. Don't return the `DocumentChangeAction[]` to the template. See the example below.

#### Example

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Shirt { name: string; price: number; }
export interface ShirtId extends Shirt { id: string; }

@Component({
  selector: 'app-root',
  template: `
    <ul>
      <li *ngFor="let shirt of shirts | async">
        {{ shirt.name }} is {{ shirt.price }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private shirtCollection: AngularFirestoreCollection<Shirt>;
  shirts: Observable<ShirtId[]>;
  constructor(private readonly afs: AngularFirestore) {
    this.shirtCollection = afs.collection<Shirt>('shirts');
    // .snapshotChanges() returns a DocumentChangeAction[], which contains
    // a lot of information about "what happened" with each change. If you want to
    // get the data and the id use the map operator.
    this.shirts = this.shirtCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Shirt;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
}
```

### `stateChanges()`

**What is it?** - Returns an Observable of the most recent changes as a `DocumentChangeAction[]`. 

**Why would you use it?** - The above methods return a synchronized array sorted in query order. `stateChanges()` emits changes as they occur rather than syncing the query order. This works well for ngrx integrations as you can build your own data structure in your reducer methods.

**When would you not use it?** - When you just need a list of data. This is a more advanced usage of AngularFirestore.

#### Example

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AccountDeposit { description: string; amount: number; }
export interface AccountDepositId extends AccountDeposit { id: string; }

@Component({
  selector: 'app-root',
  template: `
    <ul>
      <li *ngFor="let deposit of deposits | async">
        {{ deposit.description }} for {{ deposit.amount }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private depositCollection: AngularFirestoreCollection<AccountDeposit>;
  deposits: Observable<AccountDepositId[]>;
  constructor(private readonly afs: AngularFirestore) {
    this.depositCollection = afs.collection<AccountDeposit>('deposits');
    this.deposits = this.depositCollection.stateChanges(['added']).pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as AccountDeposit;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
}
```

### `auditTrail()`

**What is it?** - Returns an Observable of `DocumentChangeAction[]` as they occur. Similar to `stateChanges()`, but instead it keeps around the trail of events as an array.

**Why would you use it?** - This method is like `stateChanges()` except it is not ephemeral. It collects each change in an array as they occur. This is useful for ngrx integrations where you need to replay the entire state of an application. This also works as a great debugging tool for all applications. You can simple write `afs.collection('items').auditTrail().subscribe(console.log)` and check the events in the console as they occur.

**When would you not use it?** - When you just need a list of data. This is a more advanced usage of AngularFirestore. 

#### Example

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AccountLogItem { description: string; amount: number; }
export interface AccountLogItemId extends AccountLogItem { id: string; }

@Component({
  selector: 'app-root',
  template: `
    <ul>
      <li *ngFor="let log of accountLogs | async">
        {{ log.description }} for {{ log.amount }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private accountLogCollection: AngularFirestoreCollection<AccountLogItem>;
  accountLogs: Observable<AccountLogItemId[]>;
  constructor(private readonly afs: AngularFirestore) {
    this.accountLogCollection = afs.collection<AccountLogItem>('accountLog');
    this.accountLogs = this.accountLogCollection.auditTrail().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as AccountLogItem;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
}
```

### Limiting events

There are three `DocumentChangeType`s in Firestore: `added`, `removed`, and `modified`. Each streaming method listens to all three by default. However, you may only be intrested in one of these events. You can specify which events you'd like to use through the first parameter of each method:

#### Basic example

```ts
  constructor(private afs: AngularFirestore): {
    this.itemsCollection = afs.collection<Item>('items');
    this.items = this.itemsCollection.snapshotChanges(['added', 'removed']);
  }
```

#### Component example

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
    <ul>
      <li *ngFor="let item of items | async">
        {{ item.name }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>;
  items: Observable<Item[]>;
  constructor(private afs: AngularFirestore) {
    this.itemsCollection = afs.collection<Item>('items');
    this.items = this.itemsCollection.valueChanges(['added', 'removed']);
  }
}
```

## State based vs. action based

Each one of these methods falls into two categories: state based and action based. State based methods return the state of your collection "as-is". Whereas action based methods return "what happened" in your collection.

For example, a user updates the third item in a list. In a state based method like `.valueChanges()` will update the third item in the collection and return an array of JSON data. This is how your state looks.

## Adding documents to a collection

To add a new document to a collection with a generated id use the `add()` method. This method uses the type provided by the generic class to validate it's type structure.

#### Basic example

```ts
  constructor(private afs: AngularFirestore): {
    const shirtsCollection = afs.collection<Item>('tshirts');
    shirtsCollection.add({ name: 'item', price: 10 });
  }
```

## Manipulating individual documents

To retrieve, update, or delete an individual document you can use the `doc()` method. This method returns an `AngularFirestoreDocument`, which provides methods for streaming, updating, and deleting. [See Using Documents with AngularFirestore for more information on how to use documents](documents.md).

### [Next Step: Querying Collections in AngularFirestore](querying-collections.md)
