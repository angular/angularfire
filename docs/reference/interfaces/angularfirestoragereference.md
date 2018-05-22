[AngularFire](../README.md) > [AngularFireStorageReference](../interfaces/angularfirestoragereference.md)

# Interface: AngularFireStorageReference

## Hierarchy

**AngularFireStorageReference**

## Index

### Methods

* [child](angularfirestoragereference.md#child)
* [delete](angularfirestoragereference.md#delete)
* [getDownloadURL](angularfirestoragereference.md#getdownloadurl)
* [getMetadata](angularfirestoragereference.md#getmetadata)
* [put](angularfirestoragereference.md#put)
* [putString](angularfirestoragereference.md#putstring)
* [updateMetatdata](angularfirestoragereference.md#updatemetatdata)

---

## Methods

<a id="child"></a>

###  child

▸ **child**(path: *`string`*): `any`

*Defined in [storage/ref.ts:10](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/ref.ts#L10)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| path | `string` |

**Returns:** `any`

___
<a id="delete"></a>

###  delete

▸ **delete**(): `Observable`<`any`>

*Defined in [storage/ref.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/ref.ts#L9)*

**Returns:** `Observable`<`any`>

___
<a id="getdownloadurl"></a>

###  getDownloadURL

▸ **getDownloadURL**(): `Observable`<`any`>

*Defined in [storage/ref.ts:7](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/ref.ts#L7)*

**Returns:** `Observable`<`any`>

___
<a id="getmetadata"></a>

###  getMetadata

▸ **getMetadata**(): `Observable`<`any`>

*Defined in [storage/ref.ts:8](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/ref.ts#L8)*

**Returns:** `Observable`<`any`>

___
<a id="put"></a>

###  put

▸ **put**(data: *`any`*, metadata?: * [UploadMetadata](../#uploadmetadata) &#124; `undefined`*): [AngularFireUploadTask](angularfireuploadtask.md)

*Defined in [storage/ref.ts:12](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/ref.ts#L12)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| data | `any` |
| `Optional` metadata |  [UploadMetadata](../#uploadmetadata) &#124; `undefined`|

**Returns:** [AngularFireUploadTask](angularfireuploadtask.md)

___
<a id="putstring"></a>

###  putString

▸ **putString**(data: *`string`*, format?: * `string` &#124; `undefined`*, metadata?: * [UploadMetadata](../#uploadmetadata) &#124; `undefined`*): [AngularFireUploadTask](angularfireuploadtask.md)

*Defined in [storage/ref.ts:13](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/ref.ts#L13)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| data | `string` |
| `Optional` format |  `string` &#124; `undefined`|
| `Optional` metadata |  [UploadMetadata](../#uploadmetadata) &#124; `undefined`|

**Returns:** [AngularFireUploadTask](angularfireuploadtask.md)

___
<a id="updatemetatdata"></a>

###  updateMetatdata

▸ **updateMetatdata**(meta: *[SettableMetadata](../#settablemetadata)*): `Observable`<`any`>

*Defined in [storage/ref.ts:11](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/ref.ts#L11)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| meta | [SettableMetadata](../#settablemetadata) |

**Returns:** `Observable`<`any`>

___

