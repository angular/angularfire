# 2. Documents in [`AngularFirestore`](../reference/classes/angularfirestore.md)

> Cloud Firestore is a NoSQL, document-oriented database. Unlike a SQL database, there are no tables or rows. Instead, you store data in *documents*, which are organized into *collections*.
Each *document* contains a set of key-value pairs. Cloud Firestore is optimized for storing large collections of small documents.

## Using [`AngularFirestoreDocument`](../reference/classes/angularfirestoredocument.md)

The [`AngularFirestoreDocument`](../reference/classes/angularfirestoredocument.md) service is a wrapper around the native Firestore SDK's [`DocumentReference` type](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference). It is a generic service that provides you with a strongly typed set of methods for manipulating and streaming data. This service is designed for use as an `@Injectable()`.

```ts
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
    <div>
      {{ (item | async)?.name }}
    </div>
  `
})
export class AppComponent {
  private itemDoc: AngularFirestoreDocument<Item>;
  item: Observable<Item>;
  constructor(private afs: AngularFirestore) {
    this.itemDoc = afs.doc<Item>('items/1');
    this.item = this.itemDoc.valueChanges();
  }
  update(item: Item) {
    this.itemDoc.update(item);
  }
}
```

### The [`DocumentChangeAction`](../reference/interfaces/documentchangeaction.md) type

With the exception of the [`valueChanges()`](../reference/classes/angularfirestoredocument.md#valuechanges), each streaming method returns an Observable of [`DocumentChangeAction[]`](../reference/interfaces/documentchangeaction.md).

A [`DocumentChangeAction`](../reference/interfaces/documentchangeaction.md) gives you the `type` and `payload` properties. The `type` tells when what [`DocumentChangeType`](../reference/README.md#documentchangetype) operation occured (`added`, `modified`, `removed`). The `payload` property is a [`DocumentChange`](../reference/interfaces/documentchange.md) which provides you important metadata about the change and a `doc` property which is the [`DocumentSnapshot`](../reference/README.md#documentsnapshot).

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

## Streaming document data

There are multiple ways of streaming collection data from Firestore.

### [`valueChanges()`](../reference/classes/angularfirestoredocument.md#valuechanges)
**What is it?** - Returns an Observable of document data. All Snapshot metadata is stripped. This method provides only the data.

**Why would you use it?** - When you just need the object data. No document metadata is attached which makes it simple to render to a view.

**When would you not use it?** - When you need the `id` of the document to use data manipulation methods. This method assumes you either are saving the `id` to the document data or using a "readonly" approach.

### [`snapshotChanges()`](../reference/classes/angularfirestoredocument.md#snapshotchanges)
**What is it?** - Returns an Observable of data as a [`DocumentChangeAction`](../reference/interfaces/documentchangeaction.md). 

**Why would you use it?** - When you need the document data but also want to keep around metadata. This metadata provides you the underyling [`DocumentReference`](../reference/README.md#documentreference) and document id. Having the document's id around makes it easier to use data manipulation methods. This method gives you more horsepower with other Angular integrations such as ngrx, forms, and animations due to the `type` property. The `type` property on each [`DocumentChangeAction`](../reference/interfaces/documentchangeaction.md) is useful for ngrx reducers, form states, and animation states.

**When would you not use it?** - When you simply need to render data to a view and don't want to do any extra processing.

## Manipulating documents

AngularFirestore provides methods for setting, updating, and deleting document data.

- [`set(data: T)`](../reference/classes/angularfirestoredocument.md#set) - Destructively updates a document's data.
- [`update(data: T)`](../reference/classes/angularfirestoredocument.md#update) - Non-destructively updates a document's data.
- [`delete()`](../reference/classes/angularfirestoredocument.md#delete) - Deletes an entire document. Does not delete any nested collections.

## Querying?

Querying has no effect on documents. Documents are a single object and querying effects a range of multiple documents. If you are looking for querying then you want to use a collection.

## Retrieving nested collections

Nesting collections is a great way to structure your data. This allows you to group related data structures together. If you are creating a "Task List" site, you can group "tasks" under a user: `user/<uid>/tasks`. 

To retrieve a nested collection use the [`collection(path: string)`](../reference/classes/angularfirestoredocument.md#collection) method.

```ts
  constructor(private afs: AngularFirestore) {
    this.userDoc = afs.doc<Item>('user/david');
    this.tasks = this.userDoc.collection<Task>('tasks').valueChanges();
  }
```

### [Next Step: Collections in AngularFirestore](collections.md)
