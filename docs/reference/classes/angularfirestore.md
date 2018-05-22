[AngularFire](../README.md) > [AngularFirestore](../classes/angularfirestore.md)

# Class: AngularFirestore

AngularFirestore Service

This service is the main entry point for this feature module. It provides an API for creating Collection and Reference services. These services can then be used to do data updates and observable streams of the data.

Example:

import { Component } from '@angular/core'; import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore'; import { Observable } from 'rxjs/Observable'; import { from } from 'rxjs/observable/from';
*__component({__*: selector: 'app-my-component', template: `<h2>Items for {{ (profile | async)?.name }} <ul> <li *ngFor="let item of items | async">{{ item.name }}</li> </ul> <div class="control-input"> <input type="text" #itemname /> <button (click)="addItem(itemname.value)">Add Item</button> </div>` }) export class MyComponent implements OnInit {

// services for data operations and data streaming private readonly itemsRef: AngularFirestoreCollection; private readonly profileRef: AngularFirestoreDocument;

// observables for template items: Observable<Item\[\]>; profile: Observable;

// inject main service constructor(private readonly afs: AngularFirestore) {}

ngOnInit() { this.itemsRef = afs.collection('items', ref => ref.where('user', '==', 'davideast').limit(10)); this.items = this.itemsRef.valueChanges().map(snap => snap.docs.map(data => doc.data())); // this.items = from(this.itemsRef); // you can also do this with no mapping

```
this.profileRef = afs.doc('users/davideast');
this.profile = this.profileRef.valueChanges();
```

}

addItem(name: string) { const user = 'davideast'; this.itemsRef.add({ name, user }); } }

## Hierarchy

**AngularFirestore**

## Index

### Constructors

* [constructor](angularfirestore.md#constructor)

### Properties

* [firestore](angularfirestore.md#firestore)
* [persistenceEnabled$](angularfirestore.md#persistenceenabled_)
* [scheduler](angularfirestore.md#scheduler)

### Methods

* [collection](angularfirestore.md#collection)
* [createId](angularfirestore.md#createid)
* [doc](angularfirestore.md#doc)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new AngularFirestore**(options: *[FirebaseOptions](../#firebaseoptions)*, nameOrConfig: * `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`*, shouldEnablePersistence: *`boolean`*, settings: *[Settings](../#settings)*, platformId: *`Object`*, zone: *`NgZone`*): [AngularFirestore](angularfirestore.md)

*Defined in [firestore/firestore.ts:98](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L98)*

Each Feature of AngularFire has a FirebaseApp injected. This way we don't rely on the main Firebase App instance and we can create named apps and use multiple apps.

**Parameters:**

| Param | Type |
| ------ | ------ |
| options | [FirebaseOptions](../#firebaseoptions) |
| nameOrConfig |  `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`|
| shouldEnablePersistence | `boolean` |
| settings | [Settings](../#settings) |
| platformId | `Object` |
| zone | `NgZone` |

**Returns:** [AngularFirestore](angularfirestore.md)

___

## Properties

<a id="firestore"></a>

###  firestore

**● firestore**: *[FirebaseFirestore](../#firebasefirestore)*

*Defined in [firestore/firestore.ts:96](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L96)*

___
<a id="persistenceenabled_"></a>

###  persistenceEnabled$

**● persistenceEnabled$**: *`Observable`<`boolean`>*

*Defined in [firestore/firestore.ts:97](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L97)*

___
<a id="scheduler"></a>

###  scheduler

**● scheduler**: *[FirebaseZoneScheduler](firebasezonescheduler.md)*

*Defined in [firestore/firestore.ts:98](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L98)*

___

## Methods

<a id="collection"></a>

###  collection

▸ **collection**T(path: *`string`*, queryFn?: *[QueryFn](../#queryfn)*): [AngularFirestoreCollection](angularfirestorecollection.md)<`T`>

▸ **collection**T(ref: *[CollectionReference](../#collectionreference)*, queryFn?: *[QueryFn](../#queryfn)*): [AngularFirestoreCollection](angularfirestorecollection.md)<`T`>

*Defined in [firestore/firestore.ts:138](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L138)*

Create a reference to a Firestore Collection based on a path or CollectionReference and an optional query function to narrow the result set.

**Type parameters:**

#### T 
**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| path | `string` |
| `Optional` queryFn | [QueryFn](../#queryfn) |   |

**Returns:** [AngularFirestoreCollection](angularfirestorecollection.md)<`T`>

*Defined in [firestore/firestore.ts:139](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L139)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| ref | [CollectionReference](../#collectionreference) |
| `Optional` queryFn | [QueryFn](../#queryfn) |

**Returns:** [AngularFirestoreCollection](angularfirestorecollection.md)<`T`>

___
<a id="createid"></a>

###  createId

▸ **createId**(): `any`

*Defined in [firestore/firestore.ts:173](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L173)*

Returns a generated Firestore Document Id.

**Returns:** `any`

___
<a id="doc"></a>

###  doc

▸ **doc**T(path: *`string`*): [AngularFirestoreDocument](angularfirestoredocument.md)<`T`>

▸ **doc**T(ref: *[DocumentReference](../#documentreference)*): [AngularFirestoreDocument](angularfirestoredocument.md)<`T`>

*Defined in [firestore/firestore.ts:158](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L158)*

Create a reference to a Firestore Document based on a path or DocumentReference. Note that documents are not queryable because they are simply objects. However, documents have sub-collections that return a Collection reference and can be queried.

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| path | `string` |

**Returns:** [AngularFirestoreDocument](angularfirestoredocument.md)<`T`>

*Defined in [firestore/firestore.ts:159](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L159)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| ref | [DocumentReference](../#documentreference) |

**Returns:** [AngularFirestoreDocument](angularfirestoredocument.md)<`T`>

___

