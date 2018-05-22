
#  AngularFire

## Index

### Classes

* [AngularFireAuth](classes/angularfireauth.md)
* [AngularFireAuthModule](classes/angularfireauthmodule.md)
* [AngularFireDatabase](classes/angularfiredatabase.md)
* [AngularFireDatabaseModule](classes/angularfiredatabasemodule.md)
* [AngularFireFunctions](classes/angularfirefunctions.md)
* [AngularFireFunctionsModule](classes/angularfirefunctionsmodule.md)
* [AngularFireModule](classes/angularfiremodule.md)
* [AngularFireStorage](classes/angularfirestorage.md)
* [AngularFireStorageModule](classes/angularfirestoragemodule.md)
* [AngularFirestore](classes/angularfirestore.md)
* [AngularFirestoreCollection](classes/angularfirestorecollection.md)
* [AngularFirestoreDocument](classes/angularfirestoredocument.md)
* [AngularFirestoreModule](classes/angularfirestoremodule.md)
* [FirebaseApp](classes/firebaseapp.md)
* [FirebaseZoneScheduler](classes/firebasezonescheduler.md)

### Interfaces

* [Action](interfaces/action.md)
* [AngularFireAction](interfaces/angularfireaction.md)
* [AngularFireList](interfaces/angularfirelist.md)
* [AngularFireObject](interfaces/angularfireobject.md)
* [AngularFireStorageReference](interfaces/angularfirestoragereference.md)
* [AngularFireUploadTask](interfaces/angularfireuploadtask.md)
* [AssociatedReference](interfaces/associatedreference.md)
* [DatabaseSnapshotDoesNotExist](interfaces/databasesnapshotdoesnotexist.md)
* [DatabaseSnapshotExists](interfaces/databasesnapshotexists.md)
* [DocumentChange](interfaces/documentchange.md)
* [DocumentChangeAction](interfaces/documentchangeaction.md)
* [DocumentSnapshotDoesNotExist](interfaces/documentsnapshotdoesnotexist.md)
* [DocumentSnapshotExists](interfaces/documentsnapshotexists.md)
* [FirebaseOperationCases](interfaces/firebaseoperationcases.md)
* [QueryDocumentSnapshot](interfaces/querydocumentsnapshot.md)
* [QuerySnapshot](interfaces/querysnapshot.md)
* [Reference](interfaces/reference.md)

### Type aliases

* [ChildEvent](#childevent)
* [CollectionReference](#collectionreference)
* [DataSnapshot](#datasnapshot)
* [DatabaseQuery](#databasequery)
* [DatabaseReference](#databasereference)
* [DatabaseSnapshot](#databasesnapshot)
* [DocumentChangeType](#documentchangetype)
* [DocumentData](#documentdata)
* [DocumentReference](#documentreference)
* [DocumentSnapshot](#documentsnapshot)
* [FieldPath](#fieldpath)
* [FirebaseAppConfig](#firebaseappconfig)
* [FirebaseAuth](#firebaseauth)
* [FirebaseDatabase](#firebasedatabase)
* [FirebaseFirestore](#firebasefirestore)
* [FirebaseFunctions](#firebasefunctions)
* [FirebaseMessaging](#firebasemessaging)
* [FirebaseOperation](#firebaseoperation)
* [FirebaseOptions](#firebaseoptions)
* [FirebaseStorage](#firebasestorage)
* [ListenEvent](#listenevent)
* [PathReference](#pathreference)
* [Primitive](#primitive)
* [Query](#query)
* [QueryFn](#queryfn)
* [QueryReference](#queryreference)
* [SetOptions](#setoptions)
* [SettableMetadata](#settablemetadata)
* [Settings](#settings)
* [SnapshotAction](#snapshotaction)
* [SnapshotOptions](#snapshotoptions)
* [StringFormat](#stringformat)
* [UploadMetadata](#uploadmetadata)
* [UploadTask](#uploadtask)
* [UploadTaskSnapshot](#uploadtasksnapshot)

### Variables

* [DefaultFirestoreSettings](#defaultfirestoresettings)
* [EnablePersistenceToken](#enablepersistencetoken)
* [FirebaseNameOrConfigToken](#firebasenameorconfigtoken)
* [FirebaseOptionsToken](#firebaseoptionstoken)
* [FirestoreSettingsToken](#firestoresettingstoken)
* [RealtimeDatabaseURL](#realtimedatabaseurl)
* [StorageBucket](#storagebucket)

### Functions

* [_firebaseAppFactory](#_firebaseappfactory)
* [associateQuery](#associatequery)
* [auditTrail](#audittrail)
* [combineChange](#combinechange)
* [combineChanges](#combinechanges)
* [createDataOperationMethod](#createdataoperationmethod)
* [createListReference](#createlistreference)
* [createObjectReference](#createobjectreference)
* [createObjectSnapshotChanges](#createobjectsnapshotchanges)
* [createRemoveMethod](#createremovemethod)
* [createStorageRef](#createstorageref)
* [createUploadTask](#createuploadtask)
* [docChanges](#docchanges)
* [fromCollectionRef](#fromcollectionref)
* [fromDocRef](#fromdocref)
* [fromRef](#fromref)
* [fromTask](#fromtask)
* [listChanges](#listchanges)
* [snapshotChanges](#snapshotchanges)
* [sortedChanges](#sortedchanges)
* [stateChanges](#statechanges)
* [validateEventsArray](#validateeventsarray)

---

## Type aliases

<a id="childevent"></a>

###  ChildEvent

**ΤChildEvent**: * "child_added" &#124; "child_removed" &#124; "child_changed" &#124; "child_moved"
*

*Defined in [database/interfaces.ts:35](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L35)*

___
<a id="collectionreference"></a>

###  CollectionReference

**ΤCollectionReference**: *`firestore.CollectionReference`*

*Defined in [firestore/interfaces.ts:5](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L5)*

___
<a id="datasnapshot"></a>

###  DataSnapshot

**ΤDataSnapshot**: *`database.DataSnapshot`*

*Defined in [database/interfaces.ts:68](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L68)*

___
<a id="databasequery"></a>

###  DatabaseQuery

**ΤDatabaseQuery**: *`database.Query`*

*Defined in [database/interfaces.ts:67](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L67)*

___
<a id="databasereference"></a>

###  DatabaseReference

**ΤDatabaseReference**: *`database.Reference`*

*Defined in [database/interfaces.ts:66](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L66)*

___
<a id="databasesnapshot"></a>

###  DatabaseSnapshot

**ΤDatabaseSnapshot**: * [DatabaseSnapshotExists](interfaces/databasesnapshotexists.md)<`T`> &#124; [DatabaseSnapshotDoesNotExist](interfaces/databasesnapshotdoesnotexist.md)<`T`>
*

*Defined in [database/interfaces.ts:64](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L64)*

___
<a id="documentchangetype"></a>

###  DocumentChangeType

**ΤDocumentChangeType**: *`firestore.DocumentChangeType`*

*Defined in [firestore/interfaces.ts:8](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L8)*

___
<a id="documentdata"></a>

###  DocumentData

**ΤDocumentData**: *`firestore.DocumentData`*

*Defined in [firestore/interfaces.ts:14](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L14)*

___
<a id="documentreference"></a>

###  DocumentReference

**ΤDocumentReference**: *`firestore.DocumentReference`*

*Defined in [firestore/interfaces.ts:6](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L6)*

___
<a id="documentsnapshot"></a>

###  DocumentSnapshot

**ΤDocumentSnapshot**: * [DocumentSnapshotExists](interfaces/documentsnapshotexists.md)<`T`> &#124; [DocumentSnapshotDoesNotExist](interfaces/documentsnapshotdoesnotexist.md)
*

*Defined in [firestore/interfaces.ts:27](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L27)*

___
<a id="fieldpath"></a>

###  FieldPath

**ΤFieldPath**: *`firestore.FieldPath`*

*Defined in [firestore/interfaces.ts:10](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L10)*

___
<a id="firebaseappconfig"></a>

###  FirebaseAppConfig

**ΤFirebaseAppConfig**: *`object`*

*Defined in [core/firebase.app.module.ts:6](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L6)*

#### Type declaration

[key: `string`]: `any`

___
<a id="firebaseauth"></a>

###  FirebaseAuth

**ΤFirebaseAuth**: *`auth.Auth`*

*Defined in [core/firebase.app.module.ts:12](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L12)*

___
<a id="firebasedatabase"></a>

###  FirebaseDatabase

**ΤFirebaseDatabase**: *`database.Database`*

*Defined in [core/firebase.app.module.ts:11](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L11)*

___
<a id="firebasefirestore"></a>

###  FirebaseFirestore

**ΤFirebaseFirestore**: *`firestore.Firestore`*

*Defined in [core/firebase.app.module.ts:15](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L15)*

___
<a id="firebasefunctions"></a>

###  FirebaseFunctions

**ΤFirebaseFunctions**: *`functions.Functions`*

*Defined in [core/firebase.app.module.ts:16](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L16)*

___
<a id="firebasemessaging"></a>

###  FirebaseMessaging

**ΤFirebaseMessaging**: *`messaging.Messaging`*

*Defined in [core/firebase.app.module.ts:13](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L13)*

___
<a id="firebaseoperation"></a>

###  FirebaseOperation

**ΤFirebaseOperation**: * `string` &#124; `database.Reference` &#124; `database.DataSnapshot`
*

*Defined in [database/interfaces.ts:4](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L4)*

___
<a id="firebaseoptions"></a>

###  FirebaseOptions

**ΤFirebaseOptions**: *`object`*

*Defined in [core/firebase.app.module.ts:5](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L5)*

#### Type declaration

[key: `string`]: `any`

___
<a id="firebasestorage"></a>

###  FirebaseStorage

**ΤFirebaseStorage**: *`storage.Storage`*

*Defined in [core/firebase.app.module.ts:14](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L14)*

___
<a id="listenevent"></a>

###  ListenEvent

**ΤListenEvent**: * "value" &#124; [ChildEvent](#childevent)
*

*Defined in [database/interfaces.ts:36](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L36)*

___
<a id="pathreference"></a>

###  PathReference

**ΤPathReference**: * [QueryReference](#queryreference) &#124; `string`
*

*Defined in [database/interfaces.ts:70](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L70)*

___
<a id="primitive"></a>

###  Primitive

**ΤPrimitive**: * `number` &#124; `string` &#124; `boolean`
*

*Defined in [database/interfaces.ts:50](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L50)*

___
<a id="query"></a>

###  Query

**ΤQuery**: *`firestore.Query`*

*Defined in [firestore/interfaces.ts:11](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L11)*

___
<a id="queryfn"></a>

###  QueryFn

**ΤQueryFn**: *`function`*

*Defined in [database/interfaces.ts:34](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L34)*
*Defined in [firestore/interfaces.ts:57](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L57)*

#### Type declaration
▸(ref: *[CollectionReference](#collectionreference)*): [Query](#query)

**Parameters:**

| Param | Type |
| ------ | ------ |
| ref | [CollectionReference](#collectionreference) |

**Returns:** [Query](#query)

___
<a id="queryreference"></a>

###  QueryReference

**ΤQueryReference**: * [DatabaseReference](#databasereference) &#124; [DatabaseQuery](#databasequery)
*

*Defined in [database/interfaces.ts:69](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L69)*

___
<a id="setoptions"></a>

###  SetOptions

**ΤSetOptions**: *`firestore.SetOptions`*

*Defined in [firestore/interfaces.ts:13](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L13)*

___
<a id="settablemetadata"></a>

###  SettableMetadata

**ΤSettableMetadata**: *`storage.SettableMetadata`*

*Defined in [storage/interfaces.ts:7](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/interfaces.ts#L7)*

___
<a id="settings"></a>

###  Settings

**ΤSettings**: *`firestore.Settings`*

*Defined in [firestore/interfaces.ts:4](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L4)*

___
<a id="snapshotaction"></a>

###  SnapshotAction

**ΤSnapshotAction**: *[AngularFireAction](interfaces/angularfireaction.md)<[DatabaseSnapshot](#databasesnapshot)<`T`>>*

*Defined in [database/interfaces.ts:48](https://github.com/angular/angularfire2/blob/a42a84f/src/database/interfaces.ts#L48)*

___
<a id="snapshotoptions"></a>

###  SnapshotOptions

**ΤSnapshotOptions**: *`firestore.SnapshotOptions`*

*Defined in [firestore/interfaces.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/interfaces.ts#L9)*

___
<a id="stringformat"></a>

###  StringFormat

**ΤStringFormat**: *`storage.StringFormat`*

*Defined in [storage/interfaces.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/interfaces.ts#L9)*

___
<a id="uploadmetadata"></a>

###  UploadMetadata

**ΤUploadMetadata**: *`storage.UploadMetadata`*

*Defined in [storage/interfaces.ts:5](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/interfaces.ts#L5)*

___
<a id="uploadtask"></a>

###  UploadTask

**ΤUploadTask**: *`storage.UploadTask`*

*Defined in [storage/interfaces.ts:3](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/interfaces.ts#L3)*

___
<a id="uploadtasksnapshot"></a>

###  UploadTaskSnapshot

**ΤUploadTaskSnapshot**: *`storage.UploadTaskSnapshot`*

*Defined in [storage/interfaces.ts:4](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/interfaces.ts#L4)*

___

## Variables

<a id="defaultfirestoresettings"></a>

### `<Const>` DefaultFirestoreSettings

**● DefaultFirestoreSettings**: *`any`* =  {timestampsInSnapshots: true} as Settings

*Defined in [firestore/firestore.ts:19](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L19)*

___
<a id="enablepersistencetoken"></a>

### `<Const>` EnablePersistenceToken

**● EnablePersistenceToken**: *`any`* =  new InjectionToken<boolean>('angularfire2.enableFirestorePersistence')

*Defined in [firestore/firestore.ts:16](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L16)*

The value of this token determines whether or not the firestore will have persistance enabled

___
<a id="firebasenameorconfigtoken"></a>

### `<Const>` FirebaseNameOrConfigToken

**● FirebaseNameOrConfigToken**: *`any`* =  new InjectionToken<string|FirebaseAppConfig|undefined>('angularfire2.app.nameOrConfig')

*Defined in [core/firebase.app.module.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L9)*

___
<a id="firebaseoptionstoken"></a>

### `<Const>` FirebaseOptionsToken

**● FirebaseOptionsToken**: *`any`* =  new InjectionToken<FirebaseOptions>('angularfire2.app.options')

*Defined in [core/firebase.app.module.ts:8](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L8)*

___
<a id="firestoresettingstoken"></a>

### `<Const>` FirestoreSettingsToken

**● FirestoreSettingsToken**: *`any`* =  new InjectionToken<Settings>('angularfire2.firestore.settings')

*Defined in [firestore/firestore.ts:17](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L17)*

___
<a id="realtimedatabaseurl"></a>

### `<Const>` RealtimeDatabaseURL

**● RealtimeDatabaseURL**: *`any`* =  new InjectionToken<string>('angularfire2.realtimeDatabaseURL')

*Defined in [core/angularfire2.ts:7](https://github.com/angular/angularfire2/blob/a42a84f/src/core/angularfire2.ts#L7)*

___
<a id="storagebucket"></a>

### `<Const>` StorageBucket

**● StorageBucket**: *`any`* =  new InjectionToken<string>('angularfire2.storageBucket')

*Defined in [storage/storage.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/storage.ts#L9)*

___

## Functions

<a id="_firebaseappfactory"></a>

###  _firebaseAppFactory

▸ **_firebaseAppFactory**(options: *[FirebaseOptions](#firebaseoptions)*, nameOrConfig?: * `string` &#124; [FirebaseAppConfig](#firebaseappconfig)*): [FirebaseApp](classes/firebaseapp.md)

*Defined in [core/firebase.app.module.ts:33](https://github.com/angular/angularfire2/blob/a42a84f/src/core/firebase.app.module.ts#L33)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| options | [FirebaseOptions](#firebaseoptions) |
| `Optional` nameOrConfig |  `string` &#124; [FirebaseAppConfig](#firebaseappconfig)|

**Returns:** [FirebaseApp](classes/firebaseapp.md)

___
<a id="associatequery"></a>

###  associateQuery

▸ **associateQuery**(collectionRef: *[CollectionReference](#collectionreference)*, queryFn?: *`(Anonymous function)`*): [AssociatedReference](interfaces/associatedreference.md)

*Defined in [firestore/firestore.ts:33](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/firestore.ts#L33)*

A utility methods for associating a collection reference with a query.

**Parameters:**

| Param | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| collectionRef | [CollectionReference](#collectionreference) | - |  A collection reference to query |
| `Default value` queryFn | `(Anonymous function)` |  ref &#x3D;&gt; ref |  The callback to create a query<br><br>Example: const { query, ref } = associateQuery(docRef.collection('items'), ref => { return ref.where('age', '<', 200); }); |

**Returns:** [AssociatedReference](interfaces/associatedreference.md)

___
<a id="audittrail"></a>

###  auditTrail

▸ **auditTrail**T(query: *[DatabaseQuery](#databasequery)*, events?: *[ChildEvent](#childevent)[]*): `Observable`<[SnapshotAction](#snapshotaction)<`T`>[]>

*Defined in [database/list/audit-trail.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/database/list/audit-trail.ts#L9)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| query | [DatabaseQuery](#databasequery) |
| `Optional` events | [ChildEvent](#childevent)[] |

**Returns:** `Observable`<[SnapshotAction](#snapshotaction)<`T`>[]>

___
<a id="combinechange"></a>

###  combineChange

▸ **combineChange**T(combined: *[DocumentChange](interfaces/documentchange.md)<`T`>[]*, change: *[DocumentChange](interfaces/documentchange.md)<`T`>*): [DocumentChange](interfaces/documentchange.md)<`T`>[]

*Defined in [firestore/collection/changes.ts:54](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/changes.ts#L54)*

Creates a new sorted array from a new change.

**Type parameters:**

#### T 
**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| combined | [DocumentChange](interfaces/documentchange.md)<`T`>[] |  - |
| change | [DocumentChange](interfaces/documentchange.md)<`T`> |   |

**Returns:** [DocumentChange](interfaces/documentchange.md)<`T`>[]

___
<a id="combinechanges"></a>

###  combineChanges

▸ **combineChanges**T(current: *[DocumentChange](interfaces/documentchange.md)<`T`>[]*, changes: *[DocumentChange](interfaces/documentchange.md)<`T`>[]*, events: *[DocumentChangeType](#documentchangetype)[]*): [DocumentChange](interfaces/documentchange.md)<`T`>[]

*Defined in [firestore/collection/changes.ts:39](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/changes.ts#L39)*

Combines the total result set from the current set of changes from an incoming set of changes.

**Type parameters:**

#### T 
**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| current | [DocumentChange](interfaces/documentchange.md)<`T`>[] |  - |
| changes | [DocumentChange](interfaces/documentchange.md)<`T`>[] |  - |
| events | [DocumentChangeType](#documentchangetype)[] |   |

**Returns:** [DocumentChange](interfaces/documentchange.md)<`T`>[]

___
<a id="createdataoperationmethod"></a>

###  createDataOperationMethod

▸ **createDataOperationMethod**T(ref: *[DatabaseReference](#databasereference)*, operation: *`string`*): `dataOperation`

*Defined in [database/list/data-operation.ts:5](https://github.com/angular/angularfire2/blob/a42a84f/src/database/list/data-operation.ts#L5)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| ref | [DatabaseReference](#databasereference) |
| operation | `string` |

**Returns:** `dataOperation`

___
<a id="createlistreference"></a>

###  createListReference

▸ **createListReference**T(query: *[DatabaseQuery](#databasequery)*, afDatabase: *[AngularFireDatabase](classes/angularfiredatabase.md)*): [AngularFireList](interfaces/angularfirelist.md)<`T`>

*Defined in [database/list/create-reference.ts:10](https://github.com/angular/angularfire2/blob/a42a84f/src/database/list/create-reference.ts#L10)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| query | [DatabaseQuery](#databasequery) |
| afDatabase | [AngularFireDatabase](classes/angularfiredatabase.md) |

**Returns:** [AngularFireList](interfaces/angularfirelist.md)<`T`>

___
<a id="createobjectreference"></a>

###  createObjectReference

▸ **createObjectReference**T(query: *[DatabaseQuery](#databasequery)*, afDatabase: *[AngularFireDatabase](classes/angularfiredatabase.md)*): [AngularFireObject](interfaces/angularfireobject.md)<`T`>

*Defined in [database/object/create-reference.ts:6](https://github.com/angular/angularfire2/blob/a42a84f/src/database/object/create-reference.ts#L6)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| query | [DatabaseQuery](#databasequery) |
| afDatabase | [AngularFireDatabase](classes/angularfiredatabase.md) |

**Returns:** [AngularFireObject](interfaces/angularfireobject.md)<`T`>

___
<a id="createobjectsnapshotchanges"></a>

###  createObjectSnapshotChanges

▸ **createObjectSnapshotChanges**T(query: *[DatabaseQuery](#databasequery)*): `snapshotChanges`

*Defined in [database/object/snapshot-changes.ts:5](https://github.com/angular/angularfire2/blob/a42a84f/src/database/object/snapshot-changes.ts#L5)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| query | [DatabaseQuery](#databasequery) |

**Returns:** `snapshotChanges`

___
<a id="createremovemethod"></a>

###  createRemoveMethod

▸ **createRemoveMethod**T(ref: *[DatabaseReference](#databasereference)*): `remove`

*Defined in [database/list/remove.ts:8](https://github.com/angular/angularfire2/blob/a42a84f/src/database/list/remove.ts#L8)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| ref | [DatabaseReference](#databasereference) |

**Returns:** `remove`

___
<a id="createstorageref"></a>

###  createStorageRef

▸ **createStorageRef**(ref: *[Reference](interfaces/reference.md)*, scheduler: *[FirebaseZoneScheduler](classes/firebasezonescheduler.md)*): [AngularFireStorageReference](interfaces/angularfirestoragereference.md)

*Defined in [storage/ref.ts:21](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/ref.ts#L21)*

Create an AngularFire wrapped Storage Reference. This object creates observable methods from promise based methods.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| ref | [Reference](interfaces/reference.md) |   |
| scheduler | [FirebaseZoneScheduler](classes/firebasezonescheduler.md) |

**Returns:** [AngularFireStorageReference](interfaces/angularfirestoragereference.md)

___
<a id="createuploadtask"></a>

###  createUploadTask

▸ **createUploadTask**(task: *[UploadTask](#uploadtask)*): [AngularFireUploadTask](interfaces/angularfireuploadtask.md)

*Defined in [storage/task.ts:26](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/task.ts#L26)*

Create an AngularFireUploadTask from a regular UploadTask from the Storage SDK. This method creates an observable of the upload and returns on object that provides multiple methods for controlling and monitoring the file upload.

**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| task | [UploadTask](#uploadtask) |   |

**Returns:** [AngularFireUploadTask](interfaces/angularfireuploadtask.md)

___
<a id="docchanges"></a>

###  docChanges

▸ **docChanges**T(query: *[Query](#query)*): `Observable`<[DocumentChangeAction](interfaces/documentchangeaction.md)<`T`>[]>

*Defined in [firestore/collection/changes.ts:12](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/changes.ts#L12)*

Return a stream of document changes on a query. These results are not in sort order but in order of occurence.

**Type parameters:**

#### T 
**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| query | [Query](#query) |   |

**Returns:** `Observable`<[DocumentChangeAction](interfaces/documentchangeaction.md)<`T`>[]>

___
<a id="fromcollectionref"></a>

###  fromCollectionRef

▸ **fromCollectionRef**T(ref: *[Query](#query)*): `Observable`<`Action`<[QuerySnapshot](interfaces/querysnapshot.md)<`T`>>>

*Defined in [firestore/observable/fromRef.ts:23](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/observable/fromRef.ts#L23)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| ref | [Query](#query) |

**Returns:** `Observable`<`Action`<[QuerySnapshot](interfaces/querysnapshot.md)<`T`>>>

___
<a id="fromdocref"></a>

###  fromDocRef

▸ **fromDocRef**T(ref: *[DocumentReference](#documentreference)*): `Observable`<`Action`<[DocumentSnapshot](#documentsnapshot)<`T`>>>

*Defined in [firestore/observable/fromRef.ts:16](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/observable/fromRef.ts#L16)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| ref | [DocumentReference](#documentreference) |

**Returns:** `Observable`<`Action`<[DocumentSnapshot](#documentsnapshot)<`T`>>>

___
<a id="fromref"></a>

###  fromRef

▸ **fromRef**T(ref: *[DatabaseQuery](#databasequery)*, event: *[ListenEvent](#listenevent)*, listenType?: *`string`*): `Observable`<[AngularFireAction](interfaces/angularfireaction.md)<[DatabaseSnapshot](#databasesnapshot)<`T`>>>

*Defined in [database/observable/fromRef.ts:16](https://github.com/angular/angularfire2/blob/a42a84f/src/database/observable/fromRef.ts#L16)*

Create an observable from a Database Reference or Database Query.

**Type parameters:**

#### T 
**Parameters:**

| Param | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| ref | [DatabaseQuery](#databasequery) | - |  Database Reference |
| event | [ListenEvent](#listenevent) | - |  Listen event type ('value', 'added', 'changed', 'removed', 'moved') |
| `Default value` listenType | `string` | &quot;on&quot; |

**Returns:** `Observable`<[AngularFireAction](interfaces/angularfireaction.md)<[DatabaseSnapshot](#databasesnapshot)<`T`>>>

___
<a id="fromtask"></a>

###  fromTask

▸ **fromTask**(task: *[UploadTask](#uploadtask)*): `any`

*Defined in [storage/observable/fromTask.ts:5](https://github.com/angular/angularfire2/blob/a42a84f/src/storage/observable/fromTask.ts#L5)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| task | [UploadTask](#uploadtask) |

**Returns:** `any`

___
<a id="listchanges"></a>

###  listChanges

▸ **listChanges**T(ref: *[DatabaseQuery](#databasequery)*, events: *[ChildEvent](#childevent)[]*): `Observable`<[SnapshotAction](#snapshotaction)<`T`>[]>

*Defined in [database/list/changes.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/database/list/changes.ts#L9)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| ref | [DatabaseQuery](#databasequery) |
| events | [ChildEvent](#childevent)[] |

**Returns:** `Observable`<[SnapshotAction](#snapshotaction)<`T`>[]>

___
<a id="snapshotchanges"></a>

###  snapshotChanges

▸ **snapshotChanges**T(query: *[DatabaseQuery](#databasequery)*, events?: *[ChildEvent](#childevent)[]*): `Observable`<[SnapshotAction](#snapshotaction)<`T`>[]>

*Defined in [database/list/snapshot-changes.ts:6](https://github.com/angular/angularfire2/blob/a42a84f/src/database/list/snapshot-changes.ts#L6)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| query | [DatabaseQuery](#databasequery) |
| `Optional` events | [ChildEvent](#childevent)[] |

**Returns:** `Observable`<[SnapshotAction](#snapshotaction)<`T`>[]>

___
<a id="sortedchanges"></a>

###  sortedChanges

▸ **sortedChanges**T(query: *[Query](#query)*, events: *[DocumentChangeType](#documentchangetype)[]*): `Observable`<[DocumentChangeAction](interfaces/documentchangeaction.md)<`T`>[]>

*Defined in [firestore/collection/changes.ts:24](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/changes.ts#L24)*

Return a stream of document changes on a query. These results are in sort order.

**Type parameters:**

#### T 
**Parameters:**

| Param | Type | Description |
| ------ | ------ | ------ |
| query | [Query](#query) |   |
| events | [DocumentChangeType](#documentchangetype)[] |

**Returns:** `Observable`<[DocumentChangeAction](interfaces/documentchangeaction.md)<`T`>[]>

___
<a id="statechanges"></a>

###  stateChanges

▸ **stateChanges**T(query: *[DatabaseQuery](#databasequery)*, events?: *[ChildEvent](#childevent)[]*): `any`

*Defined in [database/list/state-changes.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/database/list/state-changes.ts#L9)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| query | [DatabaseQuery](#databasequery) |
| `Optional` events | [ChildEvent](#childevent)[] |

**Returns:** `any`

___
<a id="validateeventsarray"></a>

###  validateEventsArray

▸ **validateEventsArray**(events?: *[DocumentChangeType](#documentchangetype)[]*): `any`[]

*Defined in [firestore/collection/collection.ts:12](https://github.com/angular/angularfire2/blob/a42a84f/src/firestore/collection/collection.ts#L12)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Optional` events | [DocumentChangeType](#documentchangetype)[] |

**Returns:** `any`[]

___

