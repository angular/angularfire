[AngularFire](../README.md) > [FirebaseZoneScheduler](../classes/firebasezonescheduler.md)

# Class: FirebaseZoneScheduler

## Hierarchy

**FirebaseZoneScheduler**

## Index

### Constructors

* [constructor](firebasezonescheduler.md#constructor)

### Properties

* [zone](firebasezonescheduler.md#zone)

### Methods

* [keepUnstableUntilFirst](firebasezonescheduler.md#keepunstableuntilfirst)
* [runOutsideAngular](firebasezonescheduler.md#runoutsideangular)
* [schedule](firebasezonescheduler.md#schedule)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new FirebaseZoneScheduler**(zone: *`NgZone`*, platformId: *`Object`*): [FirebaseZoneScheduler](firebasezonescheduler.md)

*Defined in [core/angularfire2.ts:9](https://github.com/angular/angularfire2/blob/a42a84f/src/core/angularfire2.ts#L9)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| zone | `NgZone` |
| platformId | `Object` |

**Returns:** [FirebaseZoneScheduler](firebasezonescheduler.md)

___

## Properties

<a id="zone"></a>

###  zone

**● zone**: *`NgZone`*

*Defined in [core/angularfire2.ts:10](https://github.com/angular/angularfire2/blob/a42a84f/src/core/angularfire2.ts#L10)*

___

## Methods

<a id="keepunstableuntilfirst"></a>

###  keepUnstableUntilFirst

▸ **keepUnstableUntilFirst**T(obs$: *`Observable`<`T`>*): `any`

*Defined in [core/angularfire2.ts:15](https://github.com/angular/angularfire2/blob/a42a84f/src/core/angularfire2.ts#L15)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| obs$ | `Observable`<`T`> |

**Returns:** `any`

___
<a id="runoutsideangular"></a>

###  runOutsideAngular

▸ **runOutsideAngular**T(obs$: *`Observable`<`T`>*): `Observable`<`T`>

*Defined in [core/angularfire2.ts:27](https://github.com/angular/angularfire2/blob/a42a84f/src/core/angularfire2.ts#L27)*

**Type parameters:**

#### T 
**Parameters:**

| Param | Type |
| ------ | ------ |
| obs$ | `Observable`<`T`> |

**Returns:** `Observable`<`T`>

___
<a id="schedule"></a>

###  schedule

▸ **schedule**(...args: *`any`[]*): `Subscription`

*Defined in [core/angularfire2.ts:11](https://github.com/angular/angularfire2/blob/a42a84f/src/core/angularfire2.ts#L11)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| `Rest` args | `any`[] |

**Returns:** `Subscription`

___

