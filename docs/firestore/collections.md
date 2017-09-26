# Using Collections with AngularFirestore

## Understanding Collections
Every Firestore application starts with a collection. Firestore is structured in a `Collection > Document > Collection > Document` manner. This provides you with a flexible data structure. When you query a collection you only pull back the documents and not their collections. This is different from the Firebase Realtime Database where a query at a top-level location pulls back the entire tree. No more worrying about pulling back all the way down the tree 😎.

## Using an AngularFirestoreCollection

The `AngularFirestoreCollection` service is a wrapper around the native Firestore SDK's `CollectionReference` and `Query` types. It is a generic service that provides you with a strongly typed set of methods for manipulating and streaming data. This service is designed for use as an `@Injectable()`.

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'afs-app',
  template: `
    <ul>
      <li *ngFor="item of items | async">
        {{ item.name }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>: 
  items: Observable<Item[]>;
  constructor(private afs: AngularFirestore): {
    this.itemsCollection = afs.collection<Item>('items');
    this.items = this.itemsCollection.snapshotChanges(['added', 'removed']);
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
  selector: 'afs-app',
  template: `
    <ul>
      <li *ngFor="item of items | async">
        {{ item.name }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>: 
  items: Observable<Item[]>;
  constructor(private afs: AngularFirestore): {
    this.itemsCollection = afs.collection<Item>('items');
    this.items = this.itemsCollection.snapshotChanges(['added', 'removed']);
  }
}
```

### Querying

Firestore has powerful querying syntax and the `AngularFirestoreCollection` provides a thin wrapper around it. This keeps you from having to learn two query syntax systems. If you know the Firestore query API then you know it for AngularFirestore ‼

When creating an `AngularFirestoreCollection`, use the optional callback to create a queried reference.

#### Basic Sample
```ts
  constructor(private afs: AngularFirestore): {
    this.itemsCollection = afs.collection<Item>('items', ref => ref.where('size', '==', 'large'));
    this.items = this.itemsCollection.snapshotChanges();
  }
```

#### Component Sample
```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'afs-app',
  template: `
    <ul>
      <li *ngFor="item of items | async">
        {{ item.name }}
      </li>
    </ul>
  `
})
export class AppComponent {
  private itemsCollection: AngularFirestoreCollection<Item>: 
  items: Observable<Item[]>;
  constructor(private afs: AngularFirestore): {
    this.itemsCollection = afs.collection<Item>('items', ref => {
      return ref.where('size', '==', 'large').where('price', '>', 10);
    });
    this.items = this.itemsCollection.snapshotChanges(['added', 'removed']);
  }
}
```

### Dynamic querying

Imagine you're querying a list of T-Shirts. Every facet of the query should be parameterized. Sometimes the user will search small sizes, prices less than $20, or by a specific brand. AngularFirestore intergrates with RxJS to make this easy.

#### Basic Sample
```ts
  constructor(private afs: AngularFirestore): {
    // import { of } from 'rxjs/observable/of;
    // You'll use an Observable source from a ReactiveForm control or even
    // an AngularFirestoreDocument
    const criteria$ = of({ 
      size: { op: '==', value: 'large' }, 
      price: { op: '>', value: 10  }
    });
    this.items = size$.switchMap(size => {
      return this.afs
        .collection('tshirts', ref => ref.where('size', '==', size))
        .snapshotChanges();
    });
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

To retrieve, update, or delete an individual document you can use the `doc()` method. This method returns an `AngularFirestoreDocument`, which provides methods for streaming, updating, and deleting. 

See the [Documents page for complete documentation]((docs/firestore/documents.md).
