[AngularFire](../README.md) > [AngularFireObject](../interfaces/angularfireobject.md)

# Interface: AngularFireObject

## Type parameters
#### T 
## Hierarchy

**AngularFireObject**

## Index

### Properties

* [query](angularfireobject.md#query)

### Methods

* [remove](angularfireobject.md#remove)
* [set](angularfireobject.md#set)
* [snapshotChanges](angularfireobject.md#snapshotchanges)
* [update](angularfireobject.md#update)
* [valueChanges](angularfireobject.md#valuechanges)

---

## Properties

<a id="query"></a>

###  query

**● query**: *[DatabaseQuery](../#databasequery)*

*Defined in [database/interfaces.ts:19](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L19)*

___

## Methods

<a id="remove"></a>

###  remove

▸ **remove**(): `Promise`<`void`>

*Defined in [database/interfaces.ts:24](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L24)*

**Returns:** `Promise`<`void`>

___
<a id="set"></a>

###  set

▸ **set**(data: *`T`*): `Promise`<`void`>

*Defined in [database/interfaces.ts:23](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L23)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| data | `T` |

**Returns:** `Promise`<`void`>

___
<a id="snapshotchanges"></a>

###  snapshotChanges

▸ **snapshotChanges**(): `Observable`<[SnapshotAction](../#snapshotaction)<`T`>>

*Defined in [database/interfaces.ts:21](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L21)*

**Returns:** `Observable`<[SnapshotAction](../#snapshotaction)<`T`>>

___
<a id="update"></a>

###  update

▸ **update**(data: *`Partial`<`T`>*): `Promise`<`void`>

*Defined in [database/interfaces.ts:22](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L22)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| data | `Partial`<`T`> |

**Returns:** `Promise`<`void`>

___
<a id="valuechanges"></a>

###  valueChanges

▸ **valueChanges**(): `Observable`< `T` &#124; `null`>

*Defined in [database/interfaces.ts:20](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L20)*

**Returns:** `Observable`< `T` &#124; `null`>

___

