# 3. Collections in AngularFirestore

> Cloud Firestore is a NoSQL, document-oriented database. Unlike a SQL database, there are no tables or rows. Instead, you store data in *documents*, which are organized into *collections*.
Each *document* contains a set of key-value pairs. Cloud Firestore is optimized for storing large collections of small documents.

## Using `AngularFirestoreCollection`

The `AngularFirestoreCollection` service is a wrapper around the native Firestore SDK's [`CollectionReference`](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference) and [`Query`](https://firebase.google.com/docs/reference/js/firebase.firestore.Query) types. It is a generic service that provides you with a strongly typed set of methods for manipulating and streaming data. This service is designed for use as an `@Injectable()`.

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';

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

The `AngularFirestoreCollection` is service you use to create streams of the collection and perform data operations on the underyling collection.

### The `DocumentChangeAction` type

With the exception of the `valueChanges()`, each streaming method returns an Observable of `DocumentChangeAction[]`.

A `DocumentChangeAction` gives you the `type` and `payload` properties. The `type` tells when what `DocumentChangeType` operation occured (`added`, `modified`, `removed`). The `payload` property is a `DocumentChange` which provides you important metdata about the change and a `doc` property which is the `DocumentSnapshot`.

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

### `valueChanges()`
**What is it?** - Returns an Observable of data as a synchronized array of JSON objects. All Snapshot metadata is stripped and just the method provides only the data.

**Why would you use it?** - When you just need a list of data. No document metadata is attached to the resulting array which makes it simple to render to a view.

**When would you not use it?** - When you need a more complex data structure than an array or you need the `id` of each document to use data manipulation metods. This method assumes you either are saving the `id` to the document data or using a "readonly" approach.

### `snapshotChanges()`
**What is it?** - Returns an Observable of data as a synchronized array of `DocumentChangeAction[]`. 

**Why would you use it?** - When you need a list of data but also want to keep around metadata. Metadata provides you the underyling `DocumentReference`, document id, and array index of the single document. Having the document's id around makes it easier to use data manipulation methods. This method gives you more horsepower with other Angular integrations such as ngrx, forms, and animations due to the `type` property. The `type` property on each `DocumentChangeAction` is useful for ngrx reducers, form states, and animation states.

**When would you not use it?** - When you need a more complex data structure than an array or if you need to process changes as they occur. This array is synchronized with the remote and local changes in Firestore.

### `stateChanges()`
**What is it?** - Returns an Observable of the most recent changes as a `DocumentChangeAction[]`. 

**Why would you use it?** - The above methods return a synchronized array sorted in query order. `stateChanges()` emits changes as they occur rather than syncing the query order. This works well for ngrx integrations as you can build your own data structure in your reducer methods.

**When would you not use it?** - When you just need a list of data. This is a more advanced usage of AngularFirestore. 

### `auditTrail()`
**What is it?** - Returns an Observable of `DocumentChangeAction[]` as they occur. Similar to `stateChanges()`, but instead it keeps around the trail of events as an array.

**Why would you use it?** - This method is like `stateChanges()` except it is not ephemeral. It collects each change in an array as they occur. This is useful for ngrx integrations where you need to replay the entire state of an application. This also works as a great debugging tool for all applications. You can simple write `afs.collection('items').auditTrail().subscribe(console.log)` and check the events in the console as they occur.

**When would you not use it?** - When you just need a list of data. This is a more advanced usage of AngularFirestore. 

### Limiting events

There are three `DocumentChangeType`s in Firestore: `added`, `removed`, and `moved`. Each streaming method listens to all three by default. However, your site may only be intrested in one of these events. You can specify which events you'd like to use through the first parameter of each method:

#### Basic smaple
```ts
  constructor(private afs: AngularFirestore): {
    this.itemsCollection = afs.collection<Item>('items');
    this.items = this.itemsCollection.snapshotChanges(['added', 'removed']);
  }
```

#### Component Sample
```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';

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
}
```

## Adding documents to a collection

To add a new document to a collection with a generated id use the `add()` method. This method uses the type provided by the generic class to validate it's type structure.

#### Basic Sample
```ts
  constructor(private afs: AngularFirestore): {
    const shirtsCollection = afs.collection<Item>('tshirts');
    shirtsCollection.add({ name: 'item', price: 10 });
  }
```

## Manipulating individual documents

To retrieve, update, or delete an individual document you can use the `doc()` method. This method returns an `AngularFirestoreDocument`, which provides methods for streaming, updating, and deleting. [See Using Documents with AngularFirestore for more information on how to use documents](documents.md).

### [Next Step: Querying Collections in AngularFirestore](querying-collections.md)