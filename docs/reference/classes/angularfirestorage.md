[AngularFire](../README.md) > [AngularFireStorage](../classes/angularfirestorage.md)

# Class: AngularFireStorage

AngularFireStorage Service

This service is the main entry point for this feature module. It provides an API for uploading and downloading binary files from Cloud Storage for Firebase.

## Hierarchy

**AngularFireStorage**

## Index

### Constructors

* [constructor](angularfirestorage.md#constructor)

### Properties

* [scheduler](angularfirestorage.md#scheduler)
* [storage](angularfirestorage.md#storage)

### Methods

* [ref](angularfirestorage.md#ref)
* [upload](angularfirestorage.md#upload)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new AngularFireStorage**(options: *[FirebaseOptions](../#firebaseoptions)*, nameOrConfig: * `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`*, storageBucket: *`string`*, platformId: *`Object`*, zone: *`NgZone`*): [AngularFireStorage](angularfirestorage.md)

*Defined in [storage/storage.ts:21](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/storage.ts#L21)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| options | [FirebaseOptions](../#firebaseoptions) |
| nameOrConfig |  `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`|
| storageBucket | `string` |
| platformId | `Object` |
| zone | `NgZone` |

**Returns:** [AngularFireStorage](angularfirestorage.md)

___

## Properties

<a id="scheduler"></a>

###  scheduler

**● scheduler**: *[FirebaseZoneScheduler](firebasezonescheduler.md)*

*Defined in [storage/storage.ts:21](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/storage.ts#L21)*

___
<a id="storage"></a>

###  storage

**● storage**: *[FirebaseStorage](../#firebasestorage)*

*Defined in [storage/storage.ts:20](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/storage.ts#L20)*

___

## Methods

<a id="ref"></a>

###  ref

▸ **ref**(path: *`string`*): [AngularFireStorageReference](../interfaces/angularfirestoragereference.md)

*Defined in [storage/storage.ts:37](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/storage.ts#L37)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| path | `string` |

**Returns:** [AngularFireStorageReference](../interfaces/angularfirestoragereference.md)

___
<a id="upload"></a>

###  upload

▸ **upload**(path: *`string`*, data: *`any`*, metadata?: *[UploadMetadata](../#uploadmetadata)*): [AngularFireUploadTask](../interfaces/angularfireuploadtask.md)

*Defined in [storage/storage.ts:41](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/storage.ts#L41)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| path | `string` |
| data | `any` |
| `Optional` metadata | [UploadMetadata](../#uploadmetadata) |

**Returns:** [AngularFireUploadTask](../interfaces/angularfireuploadtask.md)

___

