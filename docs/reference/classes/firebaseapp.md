[AngularFire](../README.md) > [FirebaseApp](../classes/firebaseapp.md)

# Class: FirebaseApp

## Hierarchy

**FirebaseApp**

## Implements

* `any`

## Index

### Properties

* [auth](firebaseapp.md#auth)
* [database](firebaseapp.md#database)
* [delete](firebaseapp.md#delete)
* [firestore](firebaseapp.md#firestore)
* [functions](firebaseapp.md#functions)
* [messaging](firebaseapp.md#messaging)
* [name](firebaseapp.md#name)
* [options](firebaseapp.md#options)
* [storage](firebaseapp.md#storage)

---

## Properties

<a id="auth"></a>

###  auth

**● auth**: *`function`*

*Defined in [core/firebase.app.module.ts:21](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L21)*

#### Type declaration
▸(): [FirebaseAuth](../#firebaseauth)

**Returns:** [FirebaseAuth](../#firebaseauth)

___
<a id="database"></a>

###  database

**● database**: *`function`*

*Defined in [core/firebase.app.module.ts:23](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L23)*

#### Type declaration
▸(databaseURL?: *`string`*): [FirebaseDatabase](../#firebasedatabase)

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` databaseURL | `string` |

**Returns:** [FirebaseDatabase](../#firebasedatabase)

___
<a id="delete"></a>

###  delete

**● delete**: *`function`*

*Defined in [core/firebase.app.module.ts:28](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L28)*

#### Type declaration
▸(): `Promise`<`void`>

**Returns:** `Promise`<`void`>

___
<a id="firestore"></a>

###  firestore

**● firestore**: *`function`*

*Defined in [core/firebase.app.module.ts:29](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L29)*

#### Type declaration
▸(): [FirebaseFirestore](../#firebasefirestore)

**Returns:** [FirebaseFirestore](../#firebasefirestore)

___
<a id="functions"></a>

###  functions

**● functions**: *`function`*

*Defined in [core/firebase.app.module.ts:30](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L30)*

#### Type declaration
▸(): [FirebaseFunctions](../#firebasefunctions)

**Returns:** [FirebaseFunctions](../#firebasefunctions)

___
<a id="messaging"></a>

###  messaging

**● messaging**: *`function`*

*Defined in [core/firebase.app.module.ts:26](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L26)*

#### Type declaration
▸(): [FirebaseMessaging](../#firebasemessaging)

**Returns:** [FirebaseMessaging](../#firebasemessaging)

___
<a id="name"></a>

###  name

**● name**: *`string`*

*Defined in [core/firebase.app.module.ts:19](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L19)*

___
<a id="options"></a>

###  options

**● options**: *`__type`*

*Defined in [core/firebase.app.module.ts:20](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L20)*

___
<a id="storage"></a>

###  storage

**● storage**: *`function`*

*Defined in [core/firebase.app.module.ts:27](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L27)*

#### Type declaration
▸(storageBucket?: *`string`*): [FirebaseStorage](../#firebasestorage)

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` storageBucket | `string` |

**Returns:** [FirebaseStorage](../#firebasestorage)

___

