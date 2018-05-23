[AngularFire](../README.md) > [AngularFirestoreDocument](../classes/angularfirestoredocument.md)

# Class: AngularFirestoreDocument

AngularFirestoreDocument service

This class creates a reference to a Firestore Document. A reference is provided in in the constructor. The class is generic which gives you type safety for data update methods and data streaming.

This class uses Symbol.observable to transform into Observable using Observable.from().

This class is rarely used directly and should be created from the AngularFirestore service.

Example:

const fakeStock = new AngularFirestoreDocument(doc('stocks/FAKE')); await fakeStock.set({ name: 'FAKE', price: 0.01 }); fakeStock.valueChanges().map(snap => { if(snap.exists) return snap.data(); return null; }).subscribe(value => console.log(value)); // OR! Transform using Observable.from() and the data is unwrapped for you Observable.from(fakeStock).subscribe(value => console.log(value));

## Type parameters
#### T 
## Hierarchy

**AngularFirestoreDocument**

## Index

### Constructors

* [constructor](angularfirestoredocument.md#constructor)

### Properties

* [ref](angularfirestoredocument.md#ref)

### Methods

* [collection](angularfirestoredocument.md#collection)
* [delete](angularfirestoredocument.md#delete)
* [set](angularfirestoredocument.md#set)
* [snapshotChanges](angularfirestoredocument.md#snapshotchanges)
* [update](angularfirestoredocument.md#update)
* [valueChanges](angularfirestoredocument.md#valuechanges)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new AngularFirestoreDocument**(ref: *[DocumentReference](../#documentreference)*, afs: *[AngularFirestore](angularfirestore.md)*): [AngularFirestoreDocument](angularfirestoredocument.md)

*Defined in [firestore/document/document.ts:33](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/document/document.ts#L33)*

The contstuctor takes in a DocumentReference to provide wrapper methods for data operations, data streaming, and Symbol.observable.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| ref | [DocumentReference](../#documentreference) |   |
| afs | [AngularFirestore](angularfirestore.md) |

**Returns:** [AngularFirestoreDocument](angularfirestoredocument.md)

___

## Properties

<a id="ref"></a>

###  ref

**● ref**: *[DocumentReference](../#documentreference)*

*Defined in [firestore/document/document.ts:40](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/document/document.ts#L40)*

___

## Methods

<a id="collection"></a>

###  collection

▸ **collection**R(path: *`string`*, queryFn?: *[QueryFn](../#queryfn)*): [AngularFirestoreCollection](angularfirestorecollection.md)<`R`>

*Defined in [firestore/document/document.ts:72](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/document/document.ts#L72)*

Create a reference to a sub-collection given a path and an optional query function.

**Type parameters:**

#### R 
**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| path | `string` |  - |
| `Optional` queryFn | [QueryFn](../#queryfn) |   |

**Returns:** [AngularFirestoreCollection](angularfirestorecollection.md)<`R`>

___
<a id="delete"></a>

###  delete

▸ **delete**(): `Promise`<`void`>

*Defined in [firestore/document/document.ts:62](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/document/document.ts#L62)*

Delete a document.

**Returns:** `Promise`<`void`>

___
<a id="set"></a>

###  set

▸ **set**(data: *`T`*, options?: *[SetOptions](../#setoptions)*): `Promise`<`void`>

*Defined in [firestore/document/document.ts:47](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/document/document.ts#L47)*

Create or overwrite a single document.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| data | `T` |  - |
| `Optional` options | [SetOptions](../#setoptions) |   |

**Returns:** `Promise`<`void`>

___
<a id="snapshotchanges"></a>

###  snapshotChanges

▸ **snapshotChanges**(): `Observable`<`Action`<[DocumentSnapshot](../#documentsnapshot)<`T`>>>

*Defined in [firestore/document/document.ts:81](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/document/document.ts#L81)*

Listen to snapshot updates from the document.

**Returns:** `Observable`<`Action`<[DocumentSnapshot](../#documentsnapshot)<`T`>>>

___
<a id="update"></a>

###  update

▸ **update**(data: *`Partial`<`T`>*): `Promise`<`void`>

*Defined in [firestore/document/document.ts:55](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/document/document.ts#L55)*

Update some fields of a document without overwriting the entire document.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| data | `Partial`<`T`> |   |

**Returns:** `Promise`<`void`>

___
<a id="valuechanges"></a>

###  valueChanges

▸ **valueChanges**(): `Observable`< `T` &#124; `undefined`>

*Defined in [firestore/document/document.ts:90](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/document/document.ts#L90)*

Listen to unwrapped snapshot updates from the document.

**Returns:** `Observable`< `T` &#124; `undefined`>

___

