[AngularFire](../README.md) > [AngularFirestoreCollection](../classes/angularfirestorecollection.md)

# Class: AngularFirestoreCollection

AngularFirestoreCollection service

This class creates a reference to a Firestore Collection. A reference and a query are provided in in the constructor. The query can be the unqueried reference if no query is desired.The class is generic which gives you type safety for data update methods and data streaming.

This class uses Symbol.observable to transform into Observable using Observable.from().

This class is rarely used directly and should be created from the AngularFirestore service.

Example:

const collectionRef = firebase.firestore.collection('stocks'); const query = collectionRef.where('price', '>', '0.01'); const fakeStock = new AngularFirestoreCollection(collectionRef, query);

// NOTE!: the updates are performed on the reference not the query await fakeStock.add({ name: 'FAKE', price: 0.01 });

// Subscribe to changes as snapshots. This provides you data updates as well as delta updates. fakeStock.valueChanges().subscribe(value => console.log(value));

## Type parameters
#### T 
## Hierarchy

**AngularFirestoreCollection**

## Index

### Constructors

* [constructor](angularfirestorecollection.md#constructor)

### Properties

* [ref](angularfirestorecollection.md#ref)

### Methods

* [add](angularfirestorecollection.md#add)
* [auditTrail](angularfirestorecollection.md#audittrail)
* [doc](angularfirestorecollection.md#doc)
* [snapshotChanges](angularfirestorecollection.md#snapshotchanges)
* [stateChanges](angularfirestorecollection.md#statechanges)
* [valueChanges](angularfirestorecollection.md#valuechanges)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new AngularFirestoreCollection**(ref: *[CollectionReference](../#collectionreference)*, query: *[Query](../#query)*, afs: *[AngularFirestore](angularfirestore.md)*): [AngularFirestoreCollection](angularfirestorecollection.md)

*Defined in [firestore/collection/collection.ts:42](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L42)*

The constructor takes in a CollectionReference and Query to provide wrapper methods for data operations and data streaming.

Note: Data operation methods are done on the reference not the query. This means when you update data it is not updating data to the window of your query unless the data fits the criteria of the query. See the AssociatedRefence type for details on this implication.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| ref | [CollectionReference](../#collectionreference) |   |
| query | [Query](../#query) |
| afs | [AngularFirestore](angularfirestore.md) |

**Returns:** [AngularFirestoreCollection](angularfirestorecollection.md)

___

## Properties

<a id="ref"></a>

###  ref

**● ref**: *[CollectionReference](../#collectionreference)*

*Defined in [firestore/collection/collection.ts:54](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L54)*

___

## Methods

<a id="add"></a>

###  add

▸ **add**(data: *`T`*): `Promise`<[DocumentReference](../#documentreference)>

*Defined in [firestore/collection/collection.ts:123](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L123)*

Add data to a collection reference.

Note: Data operation methods are done on the reference not the query. This means when you update data it is not updating data to the window of your query unless the data fits the criteria of the query.

**Parameters:**

| Param | Type |
| ------ | ------ |
| data | `T` |

**Returns:** `Promise`<[DocumentReference](../#documentreference)>

___
<a id="audittrail"></a>

###  auditTrail

▸ **auditTrail**(events?: *[DocumentChangeType](../#documentchangetype)[]*): `Observable`<[DocumentChangeAction](../interfaces/documentchangeaction.md)<`T`>[]>

*Defined in [firestore/collection/collection.ts:88](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L88)*

Create a stream of changes as they occur it time. This method is similar to stateChanges() but it collects each event in an array over time.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| `Optional` events | [DocumentChangeType](../#documentchangetype)[] |   |

**Returns:** `Observable`<[DocumentChangeAction](../interfaces/documentchangeaction.md)<`T`>[]>

___
<a id="doc"></a>

###  doc

▸ **doc**T(path: *`string`*): [AngularFirestoreDocument](angularfirestoredocument.md)<`T`>

*Defined in [firestore/collection/collection.ts:131](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L131)*

Create a reference to a single document in a collection.

**Type parameters:**

#### T 
**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| path | `string` |   |

**Returns:** [AngularFirestoreDocument](angularfirestoredocument.md)<`T`>

___
<a id="snapshotchanges"></a>

###  snapshotChanges

▸ **snapshotChanges**(events?: *[DocumentChangeType](../#documentchangetype)[]*): `Observable`<[DocumentChangeAction](../interfaces/documentchangeaction.md)<`T`>[]>

*Defined in [firestore/collection/collection.ts:97](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L97)*

Create a stream of synchronized changes. This method keeps the local array in sorted query order.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| `Optional` events | [DocumentChangeType](../#documentchangetype)[] |   |

**Returns:** `Observable`<[DocumentChangeAction](../interfaces/documentchangeaction.md)<`T`>[]>

___
<a id="statechanges"></a>

###  stateChanges

▸ **stateChanges**(events?: *[DocumentChangeType](../#documentchangetype)[]*): `Observable`<[DocumentChangeAction](../interfaces/documentchangeaction.md)<`T`>[]>

*Defined in [firestore/collection/collection.ts:64](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L64)*

Listen to the latest change in the stream. This method returns changes as they occur and they are not sorted by query order. This allows you to construct your own data structure.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| `Optional` events | [DocumentChangeType](../#documentchangetype)[] |   |

**Returns:** `Observable`<[DocumentChangeAction](../interfaces/documentchangeaction.md)<`T`>[]>

___
<a id="valuechanges"></a>

###  valueChanges

▸ **valueChanges**(): `Observable`<`T`[]>

*Defined in [firestore/collection/collection.ts:107](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L107)*

Listen to all documents in the collection and its possible query as an Observable.

**Returns:** `Observable`<`T`[]>

___

