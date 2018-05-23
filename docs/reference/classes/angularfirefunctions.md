[AngularFire](../README.md) > [AngularFireFunctions](../classes/angularfirefunctions.md)

# Class: AngularFireFunctions

## Hierarchy

**AngularFireFunctions**

## Index

### Constructors

* [constructor](angularfirefunctions.md#constructor)

### Properties

* [functions](angularfirefunctions.md#functions)
* [scheduler](angularfirefunctions.md#scheduler)

### Methods

* [httpsCallable](angularfirefunctions.md#httpscallable)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new AngularFireFunctions**(options: *[FirebaseOptions](../#firebaseoptions)*, nameOrConfig: * `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`*, platformId: *`Object`*, zone: *`NgZone`*): [AngularFireFunctions](angularfirefunctions.md)

*Defined in [functions/functions.ts:17](https://github.com/angular/angularfire2/blob/a42a84f/src/functions/functions.ts#L17)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| options | [FirebaseOptions](../#firebaseoptions) |
| nameOrConfig |  `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`|
| platformId | `Object` |
| zone | `NgZone` |

**Returns:** [AngularFireFunctions](angularfirefunctions.md)

___

## Properties

<a id="functions"></a>

###  functions

**● functions**: *[FirebaseFunctions](../#firebasefunctions)*

*Defined in [functions/functions.ts:15](https://github.com/angular/angularfire2/blob/a42a84f/src/functions/functions.ts#L15)*

Firebase Functions instance

___
<a id="scheduler"></a>

###  scheduler

**● scheduler**: *[FirebaseZoneScheduler](firebasezonescheduler.md)*

*Defined in [functions/functions.ts:17](https://github.com/angular/angularfire2/blob/a42a84f/src/functions/functions.ts#L17)*

___

## Methods

<a id="httpscallable"></a>

###  httpsCallable

▸ **httpsCallable**T,R(name: *`string`*): `(Anonymous function)`

*Defined in [functions/functions.ts:34](https://github.com/angular/angularfire2/blob/a42a84f/src/functions/functions.ts#L34)*

**Type parameters:**

#### T 
#### R 
**Parameters:**

| Param | Type |
| ------ | ------ |
| name | `string` |

**Returns:** `(Anonymous function)`

___

