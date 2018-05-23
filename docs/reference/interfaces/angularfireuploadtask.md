[AngularFire](../README.md) > [AngularFireUploadTask](../interfaces/angularfireuploadtask.md)

# Interface: AngularFireUploadTask

## Hierarchy

**AngularFireUploadTask**

## Index

### Properties

* [task](angularfireuploadtask.md#task)

### Methods

* [cancel](angularfireuploadtask.md#cancel)
* [catch](angularfireuploadtask.md#catch)
* [pause](angularfireuploadtask.md#pause)
* [percentageChanges](angularfireuploadtask.md#percentagechanges)
* [resume](angularfireuploadtask.md#resume)
* [snapshotChanges](angularfireuploadtask.md#snapshotchanges)
* [then](angularfireuploadtask.md#then)

---

## Properties

<a id="task"></a>

###  task

**● task**: *[UploadTask](../#uploadtask)*

*Defined in [storage/task.ts:7](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L7)*

___

## Methods

<a id="cancel"></a>

###  cancel

▸ **cancel**(): `boolean`

*Defined in [storage/task.ts:11](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L11)*

**Returns:** `boolean`

___
<a id="catch"></a>

###  catch

▸ **catch**(onRejected: *`function`*): `Promise`<`any`>

*Defined in [storage/task.ts:17](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L17)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| onRejected | `function` |

**Returns:** `Promise`<`any`>

___
<a id="pause"></a>

###  pause

▸ **pause**(): `boolean`

*Defined in [storage/task.ts:10](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L10)*

**Returns:** `boolean`

___
<a id="percentagechanges"></a>

###  percentageChanges

▸ **percentageChanges**(): `Observable`< `number` &#124; `undefined`>

*Defined in [storage/task.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L9)*

**Returns:** `Observable`< `number` &#124; `undefined`>

___
<a id="resume"></a>

###  resume

▸ **resume**(): `boolean`

*Defined in [storage/task.ts:12](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L12)*

**Returns:** `boolean`

___
<a id="snapshotchanges"></a>

###  snapshotChanges

▸ **snapshotChanges**(): `Observable`< [UploadTaskSnapshot](../#uploadtasksnapshot) &#124; `undefined`>

*Defined in [storage/task.ts:8](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L8)*

**Returns:** `Observable`< [UploadTaskSnapshot](../#uploadtasksnapshot) &#124; `undefined`>

___
<a id="then"></a>

###  then

▸ **then**(onFulfilled?: * `function` &#124; `null`*, onRejected?: * `function` &#124; `null`*): `Promise`<`any`>

*Defined in [storage/task.ts:13](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L13)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` onFulfilled |  `function` &#124; `null`|
| `Optional` onRejected |  `function` &#124; `null`|

**Returns:** `Promise`<`any`>

___

