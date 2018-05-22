[AngularFire](../README.md) > [AngularFireList](../interfaces/angularfirelist.md)

# Interface: AngularFireList

## Type parameters
#### T 
## Hierarchy

**AngularFireList**

## Index

### Properties

* [query](angularfirelist.md#query)

### Methods

* [auditTrail](angularfirelist.md#audittrail)
* [push](angularfirelist.md#push)
* [remove](angularfirelist.md#remove)
* [set](angularfirelist.md#set)
* [snapshotChanges](angularfirelist.md#snapshotchanges)
* [stateChanges](angularfirelist.md#statechanges)
* [update](angularfirelist.md#update)
* [valueChanges](angularfirelist.md#valuechanges)

---

## Properties

<a id="query"></a>

###  query

**● query**: *[DatabaseQuery](../#databasequery)*

*Defined in [database/interfaces.ts:7](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L7)*

___

## Methods

<a id="audittrail"></a>

###  auditTrail

▸ **auditTrail**(events?: *[ChildEvent](../#childevent)[]*): `Observable`<[SnapshotAction](../#snapshotaction)<`T`>[]>

*Defined in [database/interfaces.ts:11](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L11)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` events | [ChildEvent](../#childevent)[] |

**Returns:** `Observable`<[SnapshotAction](../#snapshotaction)<`T`>[]>

___
<a id="push"></a>

###  push

▸ **push**(data: *`T`*): `database.ThenableReference`

*Defined in [database/interfaces.ts:14](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L14)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| data | `T` |

**Returns:** `database.ThenableReference`

___
<a id="remove"></a>

###  remove

▸ **remove**(item?: *[FirebaseOperation](../#firebaseoperation)*): `Promise`<`void`>

*Defined in [database/interfaces.ts:15](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L15)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` item | [FirebaseOperation](../#firebaseoperation) |

**Returns:** `Promise`<`void`>

___
<a id="set"></a>

###  set

▸ **set**(item: *[FirebaseOperation](../#firebaseoperation)*, data: *`T`*): `Promise`<`void`>

*Defined in [database/interfaces.ts:13](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L13)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| item | [FirebaseOperation](../#firebaseoperation) |
| data | `T` |

**Returns:** `Promise`<`void`>

___
<a id="snapshotchanges"></a>

###  snapshotChanges

▸ **snapshotChanges**(events?: *[ChildEvent](../#childevent)[]*): `Observable`<[SnapshotAction](../#snapshotaction)<`T`>[]>

*Defined in [database/interfaces.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L9)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` events | [ChildEvent](../#childevent)[] |

**Returns:** `Observable`<[SnapshotAction](../#snapshotaction)<`T`>[]>

___
<a id="statechanges"></a>

###  stateChanges

▸ **stateChanges**(events?: *[ChildEvent](../#childevent)[]*): `Observable`<[SnapshotAction](../#snapshotaction)<`T`>>

*Defined in [database/interfaces.ts:10](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L10)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` events | [ChildEvent](../#childevent)[] |

**Returns:** `Observable`<[SnapshotAction](../#snapshotaction)<`T`>>

___
<a id="update"></a>

###  update

▸ **update**(item: *[FirebaseOperation](../#firebaseoperation)*, data: *`T`*): `Promise`<`void`>

*Defined in [database/interfaces.ts:12](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L12)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| item | [FirebaseOperation](../#firebaseoperation) |
| data | `T` |

**Returns:** `Promise`<`void`>

___
<a id="valuechanges"></a>

###  valueChanges

▸ **valueChanges**(events?: *[ChildEvent](../#childevent)[]*): `Observable`<`T`[]>

*Defined in [database/interfaces.ts:8](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L8)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` events | [ChildEvent](../#childevent)[] |

**Returns:** `Observable`<`T`[]>

___

