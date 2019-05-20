<a name="5.1.2"></a>
# [5.1.2](https://github.com/angular/angularfire2/compare/5.1.1...5.1.2) (2019-03-11)


### Bug Fixes

* **afs:** No longer pull in the depreciated timestampsInSnapshots setting for Firebase 5.8 ([#2013](https://github.com/angular/angularfire2/issues/2013)) ([5df31c3](https://github.com/angular/angularfire2/commit/5df31c3))

<a name="5.1.1"></a>
# [5.1.1](https://github.com/angular/angularfire2/compare/5.1.0...5.1.1) (2018-11-29)


### Bug Fixes

* **functions:** Fix the default Functions region bug ([#1945](https://github.com/angular/angularfire2/issues/1945)) ([7d175b3](https://github.com/angular/angularfire2/commit/7d175b3))



<a name="5.1.0"></a>
# [5.1.0](https://github.com/angular/angularfire2/compare/5.0.0-rc.12...5.1.0) (2018-10-17)

### Features

* **core:** Support Angular 7 without peer dependency warnings ([ed92c45](https://github.com/angular/angularfire2/commit/ed92c45))
* **afs:** Support Firebase 5.5 and Firestore PersistenceSettings ([a9cf1ca](https://github.com/angular/angularfire2/commit/a9cf1ca))
* **functions:** Support region configuration via `FunctionsRegionToken` ([8901617](https://github.com/angular/angularfire2/commit/8901617))


<a name="5.0.2"></a>
# [5.0.2](https://github.com/angular/angularfire2/compare/5.0.1...5.0.2) (2018-09-21)

### Bug Fixes

* **messaging:** Fix for the binding issue and onTokenRefresh for Messaging ([e170da1](https://github.com/angular/angularfire2/commit/e170da1))


<a name="5.0.1"></a>
# [5.0.1](https://github.com/angular/angularfire2/compare/5.0.0...5.0.1) (2018-09-07)

Version 5.0.1 has been released for the deprecated `angularfire2` NPM library; this simply re-exports everything from `@angular/fire`; allowing you to use either `angularfire2` or `@angular/fire` in your imports and `package.json`.

It will have it's dependency pinned to the corresponding minor and will be released alongside future `@angular/fire` releases for the rest of the 5.x series.


<a name="5.0.0"></a>
# [5.0.0](https://github.com/angular/angularfire2/compare/5.0.0-rc.12...5.0.0) (2018-09-04)


### Bug Fixes

* **firestore:** Better handle enablePersistence failures, esp. for Universal ([#1850](https://github.com/angular/angularfire2/issues/1850)) ([334ba7b](https://github.com/angular/angularfire2/commit/334ba7b))
* **firestore:** Add document `get()`, the options argument for `get()` should be optional, and subscriptions to `get()` should be run in the Angular Zone([#1849](https://github.com/angular/angularfire2/issues/1849)) ([185943f](https://github.com/angular/angularfire2/commit/185943f))


### Breaking changes

5.0 is now final and we're published under `@angular/fire`.

```bash
npm i --save firebase @angular/fire
```


<a name="5.0.0-rc.12"></a>
# [5.0.0-rc.12](https://github.com/angular/angularfire2/compare/5.0.0-rc.11...5.0.0-rc.12) (2018-08-24)

### Bug Fixes

* **afs:** Gracefully handle duplicate emissions on modified/deleted ([#1825](https://github.com/angular/angularfire2/issues/1825)) ([76ff6c1](https://github.com/angular/angularfire2/commit/76ff6c1))
* **core:** If an AngularFire observable was empty or threw, it could block Universal rendering ([#1832](https://github.com/angular/angularfire2/issues/1832)) ([36a8ff8](https://github.com/angular/angularfire2/commit/36a8ff8))
* **core:** Fix for the Firebase ES export problems in Node ([#1821](https://github.com/angular/angularfire2/issues/1821)) ([f1014ee](https://github.com/angular/angularfire2/commit/f1014ee))
* **storage:** Fix for zone issues on downloadURL and metadata, which blocked Universal rendering ([#1835](https://github.com/angular/angularfire2/issues/1835)) ([441607a](https://github.com/angular/angularfire2/commit/441607a))


### Features

* **firestore:** Added a `get` Observable ([#1824](https://github.com/angular/angularfire2/issues/1824)) ([9f34be8](https://github.com/angular/angularfire2/commit/9f34be8))
* **messaging:** Introducing AngularFireMessaging ([#1749](https://github.com/angular/angularfire2/issues/1749)) ([26f7613](https://github.com/angular/angularfire2/commit/26f7613))


<a name="5.0.0-rc.11"></a>
# [5.0.0-rc.11](https://github.com/angular/angularfire2/compare/5.0.0-rc.10...5.0.0-rc.11) (2018-06-13)

### Bug Fixes

* Fixed SSR compilation and misc. typing issues ([#1729](https://github.com/angular/angularfire2/issues/1729)) ([eed5802](https://github.com/angular/angularfire2/commit/eed5802))


<a name="5.0.0-rc.10"></a>
# [5.0.0-rc.10](https://github.com/angular/angularfire2/compare/5.0.0-rc.9...5.0.0-rc.10) (2018-05-22)

### Bug Fixes

* **firestore:** the type passed to `AngularFirestoreCollection` from a document's sub-collection will now default to `DocumentData`, rather than `any`, if no type is specified ([#1662](https://github.com/angular/angularfire2/issues/1662)) ([2c2fe02](https://github.com/angular/angularfire2/commit/97c8656))

### Breaking change

* **core:** AngularFire now depends only on the `firebase` NPM library, rather than `@firebase/*` and `@firebase/*-types`; this should simplify issues around keeping types in-sync and conflicts between package versions ([#1677](https://github.com/angular/angularfire2/issues/1677)) ([2c2fe02](https://github.com/angular/angularfire2/commit/53ad0d8))


<a name="5.0.0-rc.9"></a>
# [5.0.0-rc.9](https://github.com/angular/angularfire2/compare/5.0.0-rc.8...5.0.0-rc.9) (2018-05-16)


### Bug Fixes

* **core:** allow initializeApp to be used with AOT ([#1654](https://github.com/angular/angularfire2/issues/1654)) ([513565a](https://github.com/angular/angularfire2/commit/513565a))
* **core:** Allow name + config deps to be optional ([#1641](https://github.com/angular/angularfire2/issues/1641)) ([a6af604](https://github.com/angular/angularfire2/commit/a6af604))
* **firestore:** Fixed a bug where Firestore sub-collections were inheriting the type of the doc by default ([#1644](https://github.com/angular/angularfire2/issues/1644)) ([dff8ddf](https://github.com/angular/angularfire2/commit/dff8ddf))


### Features

* **auth:** Adding user and idTokenResult Observables to AngularFireAuth ([#1642](https://github.com/angular/angularfire2/issues/1642)) ([31045a9](https://github.com/angular/angularfire2/commit/31045a9))
* **functions:** Adding AngularFireFunctions with httpCallable ([#1532](https://github.com/angular/angularfire2/issues/1532)) ([26f3f5f](https://github.com/angular/angularfire2/commit/26f3f5f))
* **firestore:** types for collection, audit trail, state, and snapshot changes ([#1644](https://github.com/angular/angularfire2/issues/1644)) ([dff8ddf](https://github.com/angular/angularfire2/commit/dff8ddf))
* **rtdb:** types for collection, audit trail, snapshot, and state changes ([#1643](https://github.com/angular/angularfire2/issues/1643)) ([2c2fe02](https://github.com/angular/angularfire2/commit/2c2fe02))


### Breaking change

* To deal with the initializeApp not being able to be used in AOT ([#1635](https://github.com/angular/angularfire2/issues/1635)) we removed `FirebaseAppConfigToken` and `FirebaseAppNameToken` and replaced them with a new `FirebaseNameOrConfigToken` which accepts either an app name string or a `FirebaseAppConfig` object. ([#1654](https://github.com/angular/angularfire2/issues/1654)) ([513565a](https://github.com/angular/angularfire2/commit/513565a))
* **firestore:** If you do not specify a type to Document or Collection the default is now `DocumentData` ([#1644](https://github.com/angular/angularfire2/issues/1644)) ([dff8ddf](https://github.com/angular/angularfire2/commit/dff8ddf))



<a name="5.0.0-rc.8"></a>
# [5.0.0-rc.8](https://github.com/angular/angularfire2/compare/5.0.0-rc.7...5.0.0-rc.8) (2018-05-12)

### Bug Fixes

* Zone was already loaded, type is implied ([#1631](https://github.com/angular/angularfire2/issues/1631)) ([7d2fd53](https://github.com/angular/angularfire2/commit/7d2fd53)), closes [#1599](https://github.com/angular/angularfire2/issues/1599)

### Features

* Supporting Angular and rxjs 6 ([dd4a36c](https://github.com/angular/angularfire2/commit/dd4a36c))
* Support Firebase JS SDK 5.0 ([#1628](https://github.com/angular/angularfire2/issues/1628)) ([b99bfa3](https://github.com/angular/angularfire2/commit/b99bfa3))
* Support FirebaseAppConfig, clean up injection tokens ([#1627](https://github.com/angular/angularfire2/issues/1627)) ([57906bd](https://github.com/angular/angularfire2/commit/57906bd))
* **firestore:** Support Firestore Settings, timestampsInSnapshots default to true ([#1629](https://github.com/angular/angularfire2/issues/1629)) ([570c0a7](https://github.com/angular/angularfire2/commit/570c0a7))
* **auth:** Update to rxjs pipeable operators ([#1621](https://github.com/angular/angularfire2/issues/1621)) ([0c3b215](https://github.com/angular/angularfire2/commit/0c3b215))
* **core:** Update to rxjs pipeable operators ([#1620](https://github.com/angular/angularfire2/issues/1620)) ([3fbbb7d](https://github.com/angular/angularfire2/commit/3fbbb7d))
* **database:** Update to rxjs pipeable operators ([#1622](https://github.com/angular/angularfire2/issues/1622)) ([5c3681d](https://github.com/angular/angularfire2/commit/5c3681d))
* **firestore:** Update to rxjs pipeable operators ([#1623](https://github.com/angular/angularfire2/issues/1623)) ([97b26e3](https://github.com/angular/angularfire2/commit/97b26e3))
* **storage:** Update to rxjs pipeable operators ([#1624](https://github.com/angular/angularfire2/issues/1624)) ([014be21](https://github.com/angular/angularfire2/commit/014be21))

### Breaking changes

* Due to the addition of a conflicting `FirebaseAppConfig` interface in Firebase 4.13 we've now changed our `FirebaseAppConfig` Injection Token to be `FirebaseOptionsToken`
* For consistency the `FirebaseAppName` Injection Token is now `FirebaseAppNameToken`
* rxjs 5 is no longer supported, upgrade to 6 ([see the rxjs migration guide for more information](https://github.com/ReactiveX/rxjs/blob/master/MIGRATION.md))
* Firebase JS SDK 4.x is no longer supported, upgrade to 5 ([see the changelog for more information](https://firebase.google.com/support/release-notes/js#version_500_may_8_2018))
* To mirror a change in Firebase 5.x, `downloadURL` was removed from `AngularFireUploadTask`

### Known issues

* Some users may experience failures compiling AOT while using `AngularFireModule.initializeApp(...)`, a work-around is available ([see #1635](https://github.com/angular/angularfire2/issues/1635))

<a name="5.0.0-rc.7"></a>
# [5.0.0-rc.7](https://github.com/angular/angularfire2/compare/5.0.0-rc.6...5.0.0-rc.7) (2018-05-04)

### Bug Fixes

* **afs:** workarounds for bugs in the Firebase JS SDK [#605](https://github.com/firebase/firebase-js-sdk/issues/605) and [#608](https://github.com/firebase/firebase-js-sdk/issues/608) ([#1540](https://github.com/angular/angularfire2/issues/1540)) ([14e78ec](https://github.com/angular/angularfire2/commit/14e78ec))
* **app:** add automaticDataCollectionEnabled for compatability with Firebase JS SDK v4.13+ ([#1572](https://github.com/angular/angularfire2/issues/1572)) ([f2cf159](https://github.com/angular/angularfire2/commit/f2cf159))


### Features

* **firestore:** allow collection and doc from ref ([#1487](https://github.com/angular/angularfire2/issues/1487)) ([136f1e5](https://github.com/angular/angularfire2/commit/136f1e5)), closes [#1337](https://github.com/angular/angularfire2/issues/1337)
* `runOutsideAngular` for Universal / service worker compatability and allow advanced configuration with DI ([#1454](https://github.com/angular/angularfire2/issues/1454)) ([e343f13](https://github.com/angular/angularfire2/commit/e343f13))


<a name="5.0.0-rc.6"></a>
# [5.0.0-rc.6](https://github.com/angular/angularfire2/compare/5.0.0-rc.4...v5.0.0-rc.6) (2018-01-26)


### Bug Fixes

* Migrate imports to new Typings from 4.8.1 to resolve [#1385](https://github.com/angular/angularfire2/issues/1385) ([7ec51b2](https://github.com/angular/angularfire2/commit/7ec51b2))
* Removing errant old import. Updating build with latest namespace. Fixing import for main [@firebase](https://github.com/firebase)/app. This resolves failing tests. ([a13bf9b](https://github.com/angular/angularfire2/commit/a13bf9b))
* **afs:** fix di warning ([#1401](https://github.com/angular/angularfire2/issues/1401)) ([23ab383](https://github.com/angular/angularfire2/commit/23ab383))
* **afs/typings:** valueChanges should return Observable<T|null> ([#1321](https://github.com/angular/angularfire2/issues/1321)) ([aadc71a](https://github.com/angular/angularfire2/commit/aadc71a))


### Features
* **storage:** Add Cloud Storage support ([e2283b1](https://github.com/angular/angularfire2/commit/e2283b1))



<a name="5.0.0-rc.4"></a>
# [5.0.0-rc.4](https://github.com/angular/angularfire2/compare/5.0.0-rc.3...5.0.0-rc.4) (2017-11-17)


### Bug Fixes

* **afs:** added missing type to doc() ([#1286](https://github.com/angular/angularfire2/issues/1286)) ([3e00e16](https://github.com/angular/angularfire2/commit/3e00e16))
* **afs:** allow document set options ([#1333](https://github.com/angular/angularfire2/issues/1333)) ([81018ed](https://github.com/angular/angularfire2/commit/81018ed)), closes [#1332](https://github.com/angular/angularfire2/issues/1332)
* **afs:** catch error when enabling persistence ([#1300](https://github.com/angular/angularfire2/issues/1300)) ([61245a3](https://github.com/angular/angularfire2/commit/61245a3))
* **afs:** export interfaces ([#1277](https://github.com/angular/angularfire2/issues/1277)) ([4a21857](https://github.com/angular/angularfire2/commit/4a21857))
* **db:** inherit generics in valueChanges interface ([10afd64](https://github.com/angular/angularfire2/commit/10afd64)), closes [#1214](https://github.com/angular/angularfire2/issues/1214)
* **db:** update should take a Partial<T> object ([#1330](https://github.com/angular/angularfire2/issues/1330)) ([20e66f5](https://github.com/angular/angularfire2/commit/20e66f5)), closes [#1329](https://github.com/angular/angularfire2/issues/1329)


<a name="5.0.0-rc.3"></a>
# [5.0.0-rc.3](https://github.com/angular/angularfire2/compare/5.0.0-rc.2...5.0.0-rc.3) (2017-10-14)


### Bug Fixes

* **afs:** change doc.update() parameter type to Partial<T> ([#1247](https://github.com/angular/angularfire2/issues/1247)) ([297cabb](https://github.com/angular/angularfire2/commit/297cabb)), closes [#1245](https://github.com/angular/angularfire2/issues/1245) [#1215](https://github.com/angular/angularfire2/issues/1215)
* **rtdb:** Fixed null set handling, ordering, and cleaned up types ([#1264](https://github.com/angular/angularfire2/issues/1264)) ([eda1c41](https://github.com/angular/angularfire2/commit/eda1c41))


<a name="5.0.0-rc.2"></a>
# [5.0.0-rc.2](https://github.com/angular/angularfire2/compare/5.0.0-rc.0...5.0.0-rc.2) (2017-10-05)


### Bug Fixes

* **afs:** Allow multiple subscribers by using share, closes [#1191](https://github.com/angular/angularfire2/issues/1191) ([#1192](https://github.com/angular/angularfire2/issues/1192)) ([21522ab](https://github.com/angular/angularfire2/commit/21522ab))
* **afs:** Don't filter empty changes (allow for null set) ([eb71edc](https://github.com/angular/angularfire2/commit/eb71edc))
* **afs:** remove debugger statement from collection/changes.ts ([#1190](https://github.com/angular/angularfire2/issues/1190)) ([88a25e7](https://github.com/angular/angularfire2/commit/88a25e7))
* **auth:** Clean up the authentication module ([8ab3803](https://github.com/angular/angularfire2/commit/8ab3803))



<a name="5.0.0-rc.0"></a>
# [5.0.0-rc.0](https://github.com/angular/angularfire2/compare/4.0.0-rc.2...v5.0.0-rc.0) (2017-10-03)

### Features
* **AngularFirestore:** Module for Cloud Firestore ([90c8ede](https://github.com/angular/angularfire2/commit/90c8ede))
* **New AngularFireDatabase API:** New API for the database [#1158](https://github.com/angular/angularfire2/issues/1158)

### Breaking changes

AngularFire 5.0 brings a new API for the Realtime Database. [See the migration doc for converting to the new API](https://github.com/angular/angularfire2/blob/master/docs/version-5-upgrade.md). If you want to stay on the old database API you can use:

```ts
import { AngularFireModule } from 'angularfire2/database-deprecated';
```

<a name="4.0.0-rc.1"></a>
# [4.0.0-rc.1](https://github.com/angular/angularfire2/compare/4.0.0-rc.0...v4.0.0-rc.1) (2017-06-02)

### Breaking changes

* **rc:** Update to Firebase JS SDK 4.0 ([9642f5](https://github.com/angular/angularfire2/commit/9642f589ba73add6d49a5818a1109028f8c7729b))

In version 4.0 of the Firebase SDK `onAuthStateChanged` is only fired on sign-in and sign-out, [see the Firebase JS SDK changelog for more information](https://firebase.google.com/support/release-notes/js#4.0.0). The added `AngularFireAuth.idToken: Observable<firebase.User>` behaves as `authState` used to.

<a name="4.0.0-rc0"></a>
# [4.0.0-rc0](https://github.com/angular/angularfire2/compare/2.0.0-beta.8...v4.0.0-rc0) (2017-05-02)


### Bug Fixes

* **auth:** Use the injected app ([980c447](https://github.com/angular/angularfire2/commit/980c447))
* **build:** Add package.json files for deep paths ([cd5f2d1](https://github.com/angular/angularfire2/commit/cd5f2d1)), closes [#880](https://github.com/angular/angularfire2/issues/880)
* **database:** Fix test TypeScript errors ([750737c](https://github.com/angular/angularfire2/commit/750737c)), closes [#875](https://github.com/angular/angularfire2/issues/875)
* **database:** use switchMap when a list's query changes ([#831](https://github.com/angular/angularfire2/issues/831)) ([b85147d](https://github.com/angular/angularfire2/commit/b85147d)), closes [#830](https://github.com/angular/angularfire2/issues/830)


### Features

* **auth:** New Auth API ([12aa422](https://github.com/angular/angularfire2/commit/12aa422))
* **database:** Add AngularFireDatabaseModule ([b388627](https://github.com/angular/angularfire2/commit/b388627))
* **database:** support optional endAt/equalTo key ([#838](https://github.com/angular/angularfire2/issues/838)) ([e146492](https://github.com/angular/angularfire2/commit/e146492)), closes [#837](https://github.com/angular/angularfire2/issues/837)
* **rc:** Implement rc0 API ([398e4e2](https://github.com/angular/angularfire2/commit/398e4e2))


<a name="2.0.0-beta.8"></a>
# [2.0.0-beta.8](https://github.com/angular/angularfire2/compare/2.0.0-beta7...v2.0.0-beta.8) (2017-02-16)


### Bug Fixes

* **database:** allow null values for equalTo, etc. ([#809](https://github.com/angular/angularfire2/issues/809)) ([561e7b7](https://github.com/angular/angularfire2/commit/561e7b7))
* **database:** call apply instead of call ([7a85bd2](https://github.com/angular/angularfire2/commit/7a85bd2))
* **database:** retrieve initial list content once ([#820](https://github.com/angular/angularfire2/issues/820)) ([5c5ff7b](https://github.com/angular/angularfire2/commit/5c5ff7b)), closes [#819](https://github.com/angular/angularfire2/issues/819)
* **database:** store unwrapped snapshots ([9f3c47b](https://github.com/angular/angularfire2/commit/9f3c47b)), closes [#791](https://github.com/angular/angularfire2/issues/791)
* **utils:** Make object $key and $exists properties non-enumerable ([253401f](https://github.com/angular/angularfire2/commit/253401f))
* **utils:** Minor formatting improvement ([fc3774a](https://github.com/angular/angularfire2/commit/fc3774a))


### Features

* **database:** adds auditTime for queries ([f9cb5c3](https://github.com/angular/angularfire2/commit/f9cb5c3)), closes [#389](https://github.com/angular/angularfire2/issues/389) [#770](https://github.com/angular/angularfire2/issues/770)
* **database:** support the optional startAt key ([#821](https://github.com/angular/angularfire2/issues/821)) ([c469b11](https://github.com/angular/angularfire2/commit/c469b11))



<a name="2.0.0-beta.7"></a>
# [2.0.0-beta.7](https://github.com/angular/angularfire2/compare/2.0.0-beta.6...v2.0.0-beta.7) (2017-01-13)


### Breaking changes

* **auth:** Remove `FirebaseAuth` in favor of `AngularFireAuth`. ([d422e6])(https://github.com/angular/angularfire2/commit/d422e62b46a80d9fb12c9a9e2cf1cf2f7db04dd3)

### Bug Fixes

* **aot:** Remove AuthBackend param for AOT support ([f875360](https://github.com/angular/angularfire2/commit/f875360))
* **auth_backend:** Update logout method to return a promise ([169ce64](https://github.com/angular/angularfire2/commit/169ce64)), closes [#583](https://github.com/angular/angularfire2/issues/583)
* **config:** Add messagingSenderId to FirebaseAppConfig ([9c84869](https://github.com/angular/angularfire2/commit/9c84869))
* **database:** Allow null values for equalTo, etc. ([70a3e94](https://github.com/angular/angularfire2/commit/70a3e94)), closes [#704](https://github.com/angular/angularfire2/issues/704)
* **database:** Removed unused query option ([9cbc59b](https://github.com/angular/angularfire2/commit/9cbc59b)), closes [#706](https://github.com/angular/angularfire2/issues/706)
* **list:** Fix FirebaseListObservable emit as array bug [#574](https://github.com/angular/angularfire2/issues/574) ([ce3de04](https://github.com/angular/angularfire2/commit/ce3de04))
* **module:** Conditionally pass app name ([8427009](https://github.com/angular/angularfire2/commit/8427009))

### Features

* **module:** Add a custom FirebaseApp name ([73a3e26](https://github.com/angular/angularfire2/commit/73a3e26))



<a name="2.0.0-beta.6-preview"></a>
# [2.0.0-beta.6-preview](https://github.com/angular/angularfire2/compare/2.0.0-beta.5...v2.0.0-beta.6-preview) (2016-11-02)


### Bug Fixes

* **Database:** use Zone scheduler for object and list factories ([e18da0e](https://github.com/angular/angularfire2/commit/e18da0e)), closes [#637](https://github.com/angular/angularfire2/issues/637)
* **AoT:** change constructor param interface type annotation to any ([2c0a57f](https://github.com/angular/angularfire2/commit/2c0a57f))
* **build:** Fix npm test and test:watch commands for windows ([86b4b24](https://github.com/angular/angularfire2/commit/86b4b24)), closes [#217](https://github.com/angular/angularfire2/issues/217)
* **database:** Add $ref to observables ([#447](https://github.com/angular/angularfire2/issues/447)) ([a53fac0](https://github.com/angular/angularfire2/commit/a53fac0)), closes [#294](https://github.com/angular/angularfire2/issues/294)
* **imports:** add firebase imports to all places that reference firebase namespace ([c3a954c](https://github.com/angular/angularfire2/commit/c3a954c)), closes [#525](https://github.com/angular/angularfire2/issues/525)


### Features

* **docs:** Add AoT installation and setup ([#546](https://github.com/angular/angularfire2/issues/546)) ([7c20d13](https://github.com/angular/angularfire2/commit/7c20d13))
* **docs:** update installation guide to latest cli version ([#519](https://github.com/angular/angularfire2/issues/519)) ([648666f](https://github.com/angular/angularfire2/commit/648666f))
* **hmr:** Add Hot module reloading ([c32a008](https://github.com/angular/angularfire2/commit/c32a008))

### Notes

A TypeScript issue with the previous release has been fixed, where errors about a missing `firebase` namespace were reported. For
applications that worked around this issue by manually adding the `firebase.d.ts` typings to `tsconfig.json`, those typings
should now be removed since the firebase namespace should automatically be resolved within AngularFire.
See [this issue](https://github.com/angular/angularfire2/issues/525) for more context.

<a name="2.0.0-beta.5"></a>
# [2.0.0-beta.5](https://github.com/angular/angularfire2/compare/2.0.0-beta.4...v2.0.0-beta.5) (2016-09-15)


### Bug Fixes

* **docs:** Remove [@next](https://github.com/next) install ([5984a99](https://github.com/angular/angularfire2/commit/5984a99))
* **docs:** typos ([197026a](https://github.com/angular/angularfire2/commit/197026a))
* **docs:** Update for beta.4 ([f2d5ba5](https://github.com/angular/angularfire2/commit/f2d5ba5))
* **docs:** Update for beta.4 ([b347e16](https://github.com/angular/angularfire2/commit/b347e16))
* **firebase_*_factory.js:** Fix calls to off() which inadvertently cancel all listeners on the path ([#469](https://github.com/angular/angularfire2/issues/469)) ([b4fb281](https://github.com/angular/angularfire2/commit/b4fb281)), closes [#443](https://github.com/angular/angularfire2/issues/443)
* **package:** Version number ([986685a](https://github.com/angular/angularfire2/commit/986685a))


### Features

* **utils:** Add $exists method to AFUnwrappedSnapshot ([#471](https://github.com/angular/angularfire2/issues/471)) ([f67aab1](https://github.com/angular/angularfire2/commit/f67aab1))
* upgrade to RC7 ([#505](https://github.com/angular/angularfire2/issues/505)) ([2410b2d](https://github.com/angular/angularfire2/commit/2410b2d))

### BREAKING CHANGES

The way this project is packaged has changed to be consistent with other Angular packages.
Previously:

 * The project just consisted of CommonJS modules, with `angularfire2.js` as the main entry point.
 * The project provided an `es6` directory which contained es2015 modules and es2015 JS
 * Package.json included `main` and `jsnext:main` fields, pointing to `angularfire2.js` and `es6/angularfire2.js`, respectively.

Now:

 * The project ships ES2015 modules with ES5 JS at the root, as well as an ES5 UMD bundle at `bundles/angulafire2.umd.js`
 * The `main` field of `package.json` points to `bundles/angularfire2.umd.js`.
 * Instead of `jsnext:main`, we're using the `module` field of package.json to point to `index.js`.
 * Instead of `angularfire2.js` being the main entry point, an `index.js` has been added (though angulafire2.js hasn't changed significantly).

If you're using Rollup or Webpack, they should _just work_ with this new setup (please open issues if not). If using SystemJS, you should be able to
add `format: 'esm'` inside of the packages configuration, and it should load and parse the es2015 modules correctly.

The addition of the umd bundle will also make it possible to use AngularFire2 in a `<script>` tag, such as in a plunker or JSBin. The library is
exported on a global called `angularFire2`.

<a name="2.0.0-beta.4"></a>
# [2.0.0-beta.4](https://github.com/angular/angularfire2/compare/2.0.0-beta.2...v2.0.0-beta.3) (2016-08-22)


* a handful of package and publish chores (#312) ([ac8c6be](https://github.com/angular/angularfire2/commit/ac8c6be)), closes [#272](https://github.com/angular/angularfire2/issues/272) [#311](https://github.com/angular/angularfire2/issues/311) [#310](https://github.com/angular/angularfire2/issues/310) [#293](https://github.com/angular/angularfire2/issues/293) [#246](https://github.com/angular/angularfire2/issues/246)


### Bug Fixes

* **auth:** add scheduler to schedule onAuth events through Angular zone ([#368](https://github.com/angular/angularfire2/issues/368)) ([3615318](https://github.com/angular/angularfire2/commit/3615318)), closes [#354](https://github.com/angular/angularfire2/issues/354)
* **auth:** Auth config for initializeApp ([#428](https://github.com/angular/angularfire2/issues/428)) ([a2ee25d](https://github.com/angular/angularfire2/commit/a2ee25d))
* **auth:** check protocol before calling getRedirectResult ([#271](https://github.com/angular/angularfire2/issues/271)) ([f38e9d7](https://github.com/angular/angularfire2/commit/f38e9d7)), closes [#243](https://github.com/angular/angularfire2/issues/243)
* **auth:** make statically analyzable x2 ([#427](https://github.com/angular/angularfire2/issues/427)) ([ab80954](https://github.com/angular/angularfire2/commit/ab80954))
* **auth:** providerData issue ([#420](https://github.com/angular/angularfire2/issues/420)) ([1ebb726](https://github.com/angular/angularfire2/commit/1ebb726))
* **list:** FirebaseListObservable shape ([#321](https://github.com/angular/angularfire2/issues/321)) ([35e8583](https://github.com/angular/angularfire2/commit/35e8583))
* **providers:** make AoT compile friendly ([#410](https://github.com/angular/angularfire2/issues/410)) ([6219ac1](https://github.com/angular/angularfire2/commit/6219ac1))


### Features

* **docs:** Docs for RC5 ([9870a7f](https://github.com/angular/angularfire2/commit/9870a7f))


### BREAKING CHANGES

* Previously, es modules were published to the es6/ directory inside the npm
package. This change publishes them to the esm directory to be consistent
with other angular packages. Currently, the es6 directory is still published
in the npm package, but will be removed in a future release.
* auth: The AngularFireAuth class has changed the order of its constructor arguments.
Since this is usually instantiated automatically via dependency injection,
it shouldn't affect common usage of the library. However, if manually
instantiating AngularFireAuth in tests or in an application, the order of
arguments is now: `(AuthBackend, WindowLocation[, AuthConfiguration])`.



<a name="2.0.0-beta.2"></a>
# [2.0.0-beta.2](https://github.com/angular/angularfire2/compare/2.0.0-beta.1...v2.0.0-beta.2) (2016-06-22)


### Bug Fixes

* **auth:** check for null user before attempting to transform ([981f0f5](https://github.com/angular/angularfire2/commit/981f0f5)), closes [#251](https://github.com/angular/angularfire2/issues/251)
* **auth:** correctly emit anonymous auth state ([51c8caa](https://github.com/angular/angularfire2/commit/51c8caa))
* **auth:** make sure onAuth runs in Angular zone ([d9a6ae7](https://github.com/angular/angularfire2/commit/d9a6ae7)), closes [#231](https://github.com/angular/angularfire2/issues/231)
* **build:** downgrade to stable TS version to fix d.ts ([664a156](https://github.com/angular/angularfire2/commit/664a156)), closes [#250](https://github.com/angular/angularfire2/issues/250)



# AngularFire2 2.0.0-beta.1

This release updates AngularFire to the Firebase 3 SDK. There are a few breaking changes, most notably in how
apps are configured, and how third-party oauth tokens are handled.

## Breaking Changes:
 * [Upgrade to the Firebase 3.0+ SDK](https://firebase.google.com/docs/web/setup), versions less than 3.0 are not supported. [abe11a2](https://github.com/angular/angularfire2/pull/200/commits/abe11a2fd8f5a3f554056625b751e9308e56b906)
 * `defaultFirebase` takes in a configuration object rather than a database url string. [See docs for more info.](https://github.com/angular/angularfire2/blob/master/docs/1-install-and-setup.md)
 * Access tokens for third party auth (github, google, facebook, twitter) are not persisted after refresh.

# AngularFire2 2.0.0-beta.0

## Features
 * Declarative Querying [Commit](https://github.com/angular/angularfire2/commit/62c16078488e7320c91baeec6b9b255469a34cc9)
 * Upgrade to Angular RC.1 [Commit](https://github.com/angular/angularfire2/commit/1eb383aa7e4855996101b07356db31476ca29ef9)

## Bug Fixes
 * **FirebaseListFactory**: prevent first item being duplicated when it [Commit](https://github.com/angular/angularfire2/commit/314c5954215cf5e6a9129ac973dee1831268d6a5)


## Docs
 * Many Developer guides added! [First Guide](https://github.com/angular/angularfire2/blob/master/docs/1-install-and-setup.md) [Commit](https://github.com/angular/angularfire2/commit/d1ac3a483c3d334f10e929e299e4e75e3395af31)

## Breaking Changes:
 * Web Worker support has been temporarily removed due to Angular 2 RC.0 not yet supporting Web Workers
