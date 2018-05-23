[AngularFire](../README.md) > [AngularFireDatabase](../classes/angularfiredatabase.md)

# Class: AngularFireDatabase

## Hierarchy

**AngularFireDatabase**

## Index

### Constructors

* [constructor](angularfiredatabase.md#constructor)

### Properties

* [database](angularfiredatabase.md#database)
* [scheduler](angularfiredatabase.md#scheduler)

### Methods

* [createPushId](angularfiredatabase.md#createpushid)
* [list](angularfiredatabase.md#list)
* [object](angularfiredatabase.md#object)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new AngularFireDatabase**(options: *[FirebaseOptions](../#firebaseoptions)*, nameOrConfig: * `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`*, databaseURL: *`string`*, platformId: *`Object`*, zone: *`NgZone`*): [AngularFireDatabase](angularfiredatabase.md)

*Defined in [database/database.ts:12](https://github.com/angular/angularfire2/blob/a42a84f/src/database/database.ts#L12)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| options | [FirebaseOptions](../#firebaseoptions) |
| nameOrConfig |  `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`|
| databaseURL | `string` |
| platformId | `Object` |
| zone | `NgZone` |

**Returns:** [AngularFireDatabase](angularfiredatabase.md)

___

## Properties

<a id="database"></a>

###  database

**● database**: *[FirebaseDatabase](../#firebasedatabase)*

*Defined in [database/database.ts:11](https://github.com/angular/angularfire2/blob/a42a84f/src/database/database.ts#L11)*

___
<a id="scheduler"></a>

###  scheduler

**● scheduler**: *[FirebaseZoneScheduler](firebasezonescheduler.md)*

*Defined in [database/database.ts:12](https://github.com/angular/angularfire2/blob/a42a84f/src/database/database.ts#L12)*

___

## Methods

<a id="createpushid"></a>

###  createPushId

▸ **createPushId**(): `any`

*Defined in [database/database.ts:42](https://github.com/angular/angularfire2/blob/a42a84f/src/database/database.ts#L42)*

**Returns:** `any`

___
<a id="list"></a>

###  list

▸ **list**T(pathOrRef: *[PathReference](../#pathreference)*, queryFn?: *[QueryFn](../#queryfn)*): [AngularFireList](../interfaces/angularfirelist.md)<`T`>

*Defined in [database/database.ts:28](https://github.com/angular/angularfire2/blob/a42a84f/src/database/database.ts#L28)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| pathOrRef | [PathReference](../#pathreference) |
| `Optional` queryFn | [QueryFn](../#queryfn) |

**Returns:** [AngularFireList](../interfaces/angularfirelist.md)<`T`>

___
<a id="object"></a>

###  object

▸ **object**T(pathOrRef: *[PathReference](../#pathreference)*): [AngularFireObject](../interfaces/angularfireobject.md)<`T`>

*Defined in [database/database.ts:37](https://github.com/angular/angularfire2/blob/a42a84f/src/database/database.ts#L37)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| pathOrRef | [PathReference](../#pathreference) |

**Returns:** [AngularFireObject](../interfaces/angularfireobject.md)<`T`>

___

