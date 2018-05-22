[AngularFire](../README.md) > [AngularFireAuth](../classes/angularfireauth.md)

# Class: AngularFireAuth

## Hierarchy

**AngularFireAuth**

## Index

### Constructors

* [constructor](angularfireauth.md#constructor)

### Properties

* [auth](angularfireauth.md#auth)
* [authState](angularfireauth.md#authstate)
* [idToken](angularfireauth.md#idtoken)
* [idTokenResult](angularfireauth.md#idtokenresult)
* [user](angularfireauth.md#user)

---

## Constructors

<a id="constructor"></a>

###  constructor

⊕ **new AngularFireAuth**(options: *[FirebaseOptions](../#firebaseoptions)*, nameOrConfig: * `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`*, platformId: *`Object`*, zone: *`NgZone`*): [AngularFireAuth](angularfireauth.md)

*Defined in [auth/auth.ts:38](https://github.com/angular/angularfire2/blob/a42a84f/src/auth/auth.ts#L38)*

**Parameters:**

| Param | Type |
| ------ | ------ |
| options | [FirebaseOptions](../#firebaseoptions) |
| nameOrConfig |  `string` &#124; [FirebaseAppConfig](../#firebaseappconfig) &#124; `undefined`|
| platformId | `Object` |
| zone | `NgZone` |

**Returns:** [AngularFireAuth](angularfireauth.md)

___

## Properties

<a id="auth"></a>

###  auth

**● auth**: *[FirebaseAuth](../#firebaseauth)*

*Defined in [auth/auth.ts:16](https://github.com/angular/angularfire2/blob/a42a84f/src/auth/auth.ts#L16)*

Firebase Auth instance

___
<a id="authstate"></a>

###  authState

**● authState**: *`Observable`< `User` &#124; `null`>*

*Defined in [auth/auth.ts:21](https://github.com/angular/angularfire2/blob/a42a84f/src/auth/auth.ts#L21)*

Observable of authentication state; as of Firebase 4.0 this is only triggered via sign-in/out

___
<a id="idtoken"></a>

###  idToken

**● idToken**: *`Observable`< `string` &#124; `null`>*

*Defined in [auth/auth.ts:26](https://github.com/angular/angularfire2/blob/a42a84f/src/auth/auth.ts#L26)*

Observable of the currently signed-in user's JWT token used to identify the user to a Firebase service (or null).

___
<a id="idtokenresult"></a>

###  idTokenResult

**● idTokenResult**: *`Observable`< `auth.IdTokenResult` &#124; `null`>*

*Defined in [auth/auth.ts:38](https://github.com/angular/angularfire2/blob/a42a84f/src/auth/auth.ts#L38)*

Observable of the currently signed-in user's IdTokenResult object which contains the ID token JWT string and other helper properties for getting different data associated with the token as well as all the decoded payload claims (or null).

___
<a id="user"></a>

###  user

**● user**: *`Observable`< `User` &#124; `null`>*

*Defined in [auth/auth.ts:31](https://github.com/angular/angularfire2/blob/a42a84f/src/auth/auth.ts#L31)*

Observable of the currently signed-in user (or null).

___

