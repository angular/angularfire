<a name="7.2.1"></a>
# [7.2.1](https://github.com/angular/angularfire/compare/7.2.0...7.2.1) (2022-02-09)

### Bug Fixes

* **compat:** Typescript 4.5 inference breaks the PromiseProxy ([#3144](https://github.com/angular/angularfire/issues/3144)) ([f61bc7d](https://github.com/angular/angularfire/commit/f61bc7d)), closes [#3090](https://github.com/angular/angularfire/issues/3090) [#3088](https://github.com/angular/angularfire/issues/3088)
* **core:** Address bad arguments being passed to zone wrapper ([#3127](https://github.com/angular/angularfire/issues/3127)) ([8b693e4](https://github.com/angular/angularfire/commit/8b693e4))
* **core:** Defensively catch Firebase isSupported calls ([#3146](https://github.com/angular/angularfire/issues/3146)) ([520930b](https://github.com/angular/angularfire/commit/520930b))
* **schematic:** use oneOf rather than array types in the deploy schematic ([#3092](https://github.com/angular/angularfire/issues/3092)) ([058d624](https://github.com/angular/angularfire/commit/058d624))



<a name="7.2.0"></a>
# [7.2.0](https://github.com/angular/angularfire/compare/7.1.1...7.2.0) (2021-11-11)

### Features

* **core:** marking as compatible with Angular 13 peer ([#3057](https://github.com/angular/angularfire/pull/3057)) ([390691b](https://github.com/angular/angularfire/commit/390691b))

### Bug Fixes

* **schematics:** ng-add should pass if sourceRoot is relative to workspace root ([#3052](https://github.com/angular/angularfire/issues/3052)) ([7e931cb](https://github.com/angular/angularfire/commit/7e931cb))

<a name="7.1.1"></a>
# [7.1.1](https://github.com/angular/angularfire/compare/7.1.0...7.1.1) (2021-10-18)

### Bug Fixes

* **schematics:** Fix ng add on Windows ([#3022](https://github.com/angular/angularfire/issues/3022)) ([6ed7aef](https://github.com/angular/angularfire/commit/6ed7aef)), closes [#3016](https://github.com/angular/angularfire/issues/3016)

<a name="7.1.0"></a>
# [7.1.0](https://github.com/angular/angularfire/compare/7.0.4...7.1.0) (2021-10-08)

### Features

* **auth-guard:** modular auth guards now available ([#3001](https://github.com/angular/angularfire/issues/3001)) ([3ae6ce5](https://github.com/angular/angularfire/commit/3ae6ce5))
* **schematics:** setup wizard on `ng add`, allow deployment to Cloud Run, and add more configuration options to `ng deploy` ([#2836](https://github.com/angular/angularfire/issues/2836)) ([72d3c2e](https://github.com/angular/angularfire/commit/72d3c2e))
* **compat/storage**: Adding list function ([#2960](https://github.com/angular/angularfire/issues/2960)) ([ea544b](https://github.com/angular/angularfire/commit/8ea544b))
* **app-check**: Add AppCheck ([#2940](https://github.com/angular/angularfire/issues/2940)) ([337116f](https://github.com/angular/angularfire/commit/337116f))
* **compat/storage**: Transfer state support for the `getDownloadURL` pipe ([#2921](https://github.com/angular/angularfire/issues/2921)) ([d6cfe16](https://github.com/angular/angularfire/commit/d6cfe16))
* **analytics**: modular versions of `ScreenTrackingService` and `UserTrackingService` now available ([#2963](https://github.com/angular/angularfire/issues/2963)) ([d724d81](https://github.com/angular/angularfire/commit/d724d81))
* **core**: `provide*` methods can pass dependencies & the factory can use the injector for more advanced configuration ([#2963](https://github.com/angular/angularfire/issues/2963)) ([d724d81](https://github.com/angular/angularfire/commit/d724d81))

### Bug Fixes

* **compat/storage**: Type fixes for `.child` ([#2921](https://github.com/angular/angularfire/issues/2921)) ([d6cfe16](https://github.com/angular/angularfire/commit/d6cfe16))

### Misc.

* `Analytics`, `RemoteConfig`, and `Messaging` can be `null` if `isSupported()` returns false, this guards against runtime failures in unsupported environments at the cost of null checking
* Require Firebase 9.1 peer
* `ng add` installs firebase-tools globally, this also addressed the race condition
* Requires firebase-tools 9.9+ peer (optional)
* Moved peer dependencies for the schematics to proper dependencies
* Mark compatibility with rxjs 7
* Increase the accuracy of performance marks
* `ng deploy` echos out the firebase-tools version and the user
* Error message improvements

<a name="7.0.4"></a>
# [7.0.4](https://github.com/angular/angularfire/compare/7.0.3...7.0.4) (2021-09-07)


### Bug Fixes

* **compat/database:** Zone should be destabilized on get ([#2923](https://github.com/angular/angularfire/issues/2923)) ([c006da8](https://github.com/angular/angularfire/commit/c006da8))
* **compat/perf:** AFP should not error in Jest ([#2920](https://github.com/angular/angularfire/issues/2920)) ([b0e147e](https://github.com/angular/angularfire/commit/b0e147e))
* **schematics:** ng upgrade when e2e is present ([#2927](https://github.com/angular/angularfire/issues/2927)) ([9071faa](https://github.com/angular/angularfire/commit/9071faa))



<a name="7.0.3"></a>
# [7.0.3](https://github.com/angular/angularfire/compare/7.0.2...7.0.3) (2021-09-02)


### Bug fixes

* **auth:** `@angular/fire/auth` was Zone wrapping some `firebase/auth` exports it shouldn't have been
* **messaging:** `onMessage`'s callback should fire inside the Angular Zone
* **schematics:** `ng deploy` SSR should assume `bundleDependencies` defaults to true
* **schematics:** `ng deploy` SSR should not fail if an `index.html` does not exist ([#2765](https://github.com/angular/angularfire/issues/2765))


<a name="7.0.2"></a>
# [7.0.2](https://github.com/angular/angularfire2/compare/7.0.1...7.0.2) (2021-08-30)

### Bug fixes

* **types:** `firebase/*` types were not being reexported from the `@angular/fire/*` modules (modular)

<a name="7.0.1"></a>
# [7.0.1](https://github.com/angular/angularfire2/compare/7.0.0...7.0.1) (2021-08-30)

### Bug fixes

* **messaging:** `onMessage` will no longer destablize the Angular Zone
* **core:** Injected Classes now have a better fallback pattern for finding defaults, [#2909](https://github.com/angular/angularfire/issues/2909) allowing use of emulators and other config options as expected
* **schematic:** upgrade schematic will no longer rewrite `.ts` files outside of your project root, [#2907](https://github.com/angular/angularfire/issues/2907)

<a name="7.0.0"></a>
# [7.0.0](https://github.com/angular/angularfire2/compare/6.1.5...7.0.0) (2021-08-25)

### Breaking changes

* Angular 12 is required
* AngularFire now only works in Ivy applications
* Firebase JS SDK v9 is required
* The existing AngularFire v6 API surface has moved from `@angular/fire/*` to `@angular/fire/compat/*` (see compatibility mode)
* **compat/auth:** `USE_EMULATOR` DI token is now in the form of `['http://localhost:9099']`

### Features

* New modular API surface available at `@angular/fire/*`
* **compat/storage:** `USE_EMULATOR` DI token

[See the v7 upgrade guide for more information.](https://github.com/angular/angularfire/blob/master/docs/version-7-upgrade.md)

<a name="6.1.5"></a>
# [6.1.5](https://github.com/angular/angularfire/compare/6.1.4...6.1.5) (2021-05-17)

Support Angular 12 peer

### Bug Fixes

* **auth:** set the passed settings individually ([#2826](https://github.com/angular/angularfire/issues/2826)) ([984803d](https://github.com/angular/angularfire/commit/984803d))

<a name="6.1.4"></a>
# [6.1.4](https://github.com/angular/angularfire/compare/6.1.3...6.1.4) (2020-12-03)


### Bug Fixes

* **storage:** `firebase.default` typing issue with Firebase v7 ([#2703](https://github.com/angular/angularfire/issues/2703)) ([984006d](https://github.com/angular/angularfire/commit/984006d))
* **storage:** snapshotChanges should return a success snapshot ([#2704](https://github.com/angular/angularfire/issues/2704)) ([972aa85](https://github.com/angular/angularfire/commit/972aa85))
* **analytics:** no longer error when included in SSR or when using Firebase v7 ([#2701](https://github.com/angular/angularfire/issues/2704)) ([da8c660](https://github.com/angular/angularfire/commit/da8c660))


<a name="6.1.3"></a>
# [6.1.3](https://github.com/angular/angularfire/compare/6.1.2...6.1.3) (2020-11-30)


### Bug Fixes

* **afs:** allow stateChanges and auditLog to emit blank arrays at first ([21442f0](https://github.com/angular/angularfire/commit/21442f0))



<a name="6.1.2"></a>
# [6.1.2](https://github.com/angular/angularfire/compare/6.1.1...6.1.2) (2020-11-24)


### Bug Fixes

* **afs:** document's actions should have appropriate types ([#2683](https://github.com/angular/angularfire/issues/2683)) ([d36544f](https://github.com/angular/angularfire/commit/d36544f))
* **afs:** fixing the metadata in `snapshotChanges` and more ([#2670](https://github.com/angular/angularfire/issues/2670)) ([d5dbe99](https://github.com/angular/angularfire/commit/d5dbe99))
* **afs:** `stateChanges` and `auditLog` correctly emit metadata changes ([#2684](https://github.com/angular/angularfire/issues/2684)) ([fce594b](https://github.com/angular/angularfire/commit/fce594b))
* **analytics:** screen tracking will no longer fail on broken routes ([#2678](https://github.com/angular/angularfire/issues/2678)) ([ae26b35](https://github.com/angular/angularfire/commit/ae26b35)), closes [#2677](https://github.com/angular/angularfire/issues/2677)
* **auth:** removed the `shareReplay` from auth and addressed Zone.js issues ([#2682](https://github.com/angular/angularfire/issues/2682)) ([059547b](https://github.com/angular/angularfire/commit/059547b)), closes [#2681](https://github.com/angular/angularfire/issues/2681)
* **core:** ensure the UMDs are importing things correctly for the lazy modules ([#2676](https://github.com/angular/angularfire/issues/2676)) ([6817bcc](https://github.com/angular/angularfire/commit/6817bcc))
* **core:** try/catch the HMR/DI warning ([#2687](https://github.com/angular/angularfire/issues/2687)) ([1530112](https://github.com/angular/angularfire/commit/1530112))
* **storage:** unsubscribing from the upload progress will not cancel and added replay ([#2688](https://github.com/angular/angularfire/issues/2688)) ([d845cdd](https://github.com/angular/angularfire/commit/d845cdd)), closes [#2685](https://github.com/angular/angularfire/issues/2685)



<a name="6.1.1"></a>
# [6.1.1](https://github.com/angular/angularfire/compare/6.1.0...6.1.1) (2020-11-19)

### Bug Fixes

* **afs:** fix regression keeping one from overriding collection.doc type ([#2668](https://github.com/angular/angularfire/issues/2668)) ([22e2883](https://github.com/angular/angularfire/commit/22e2883))
* **core:** fix the instance cache logic ([#2667](https://github.com/angular/angularfire/issues/2667)) ([7f89643](https://github.com/angular/angularfire/commit/7f89643))
* **storage:** error state not represent in UploadTaskSnapshot ([#2665](https://github.com/angular/angularfire/issues/2665)) ([2ce41aa](https://github.com/angular/angularfire/commit/2ce41aa))


<a name="6.1.0"></a>
# [6.1.0](https://github.com/angular/angularfire/compare/6.0.4...6.1.0) (2020-11-18)

### Bug Fixes

* **database:** fix Zone.js issues by running ref-gen outside angular ([5186389](https://github.com/angular/angularfire/commit/5186389))
* **auth:** `ScreenTrackingService` will now wait for `UserTrackingService` to report an initial result, if `UserTrackingService` has been provided ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80))
* **analytics:** Bunch of analytics & screen tracking improvements ([#2654](https://github.com/angular/angularfire/pull/2654)) ([5bc159a](https://github.com/angular/angularfire/commit/5bc159a))
* **fcm:** `tokenChanges` now listen for notification permission changes and trip token detection as expected ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **firestore:** doc and collection methods generic ([#2649](https://github.com/angular/angularfire/issues/2649)) ([796b7c1](https://github.com/angular/angularfire/commit/796b7c1))
* **deploy:** remove direct workspace access ([#2643](https://github.com/angular/angularfire/issues/2643)) ([7e1918a](https://github.com/angular/angularfire/commit/7e1918a))
* **schematics:** remove experimental workspace API type usage ([#2644](https://github.com/angular/angularfire/issues/2644)) ([b976c58](https://github.com/angular/angularfire/commit/b976c58))

### Features

* **core:** Support Angular 11
* **core:** Adding global caches that survive/warn on HMR ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80)), closes [#2655](https://github.com/angular/angularfire/issues/2655)
* **auth:** Warn when using Auth emulator in conjunction with database or firestore, ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80)), closes [#2656](https://github.com/angular/angularfire/issues/2656)
* **auth:** Adding `AngularFireAuth.credential` an observer for `firebase.auth.UserCredential` ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80))
* **auth:** `ScreenTrackingService` now logs `sign_up` and `login` events ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80))
* **database:** Added `USE_EMULATOR` DI token ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **fcm:** Added `VAPID_KEY`, `SERVICE_WORKER`, and `USE_EMULATOR` DI tokens ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **fcm:** `deleteToken`'s token argument is now optional, reflecting Firebase v8 changes ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **auth:** Added `SETTINGS`, `TENANT_ID`, `LANGUAGE_CODE`, `USE_DEVICE_LANGUAGE`, `USE_EMULATOR` and `PERSISTENCE` DI tokens ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **functions:** Added `USE_EMULATOR` and `NEW_ORIGIN_BEHAVIOR` DI token to opt-into the new way of setting `ORIGIN` ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **functions:** `httpsCallable` function now takes in `HttpsCallableOptions` ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **storage:** Added `MAX_UPLOAD_RETRY_TIME` and `MAX_OPERATION_RETRY_TIME` DI tokens ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **firestore:** Inherit doc return type from class ([#2640](https://github.com/angular/angularfire/issues/2640)) ([f7bbd09](https://github.com/angular/angularfire/commit/f7bbd09))
* **firestore:** map document ID to the provided `idField` in a collection group query ([#2580](https://github.com/angular/angularfire/issues/2580)) ([dbf31d9](https://github.com/angular/angularfire/commit/dbf31d9))
* **auth-guard:** add support for specifying a `string` to redirect to ([#2448](https://github.com/angular/angularfire/issues/2448)) ([fe31191](https://github.com/angular/angularfire/commit/fe31191)), closes [#2287](https://github.com/angular/angularfire/issues/2287) [#2144](https://github.com/angular/angularfire/issues/2144)
* **database:** add option to include key on `valueChanges()` ([#2126](https://github.com/angular/angularfire/issues/2126)) ([5cdb8ce](https://github.com/angular/angularfire/commit/5cdb8ce))
* **deploy:** More deploy options ([#2647](https://github.com/angular/angularfire/issues/2647)) ([1bbd3e4](https://github.com/angular/angularfire/commit/1bbd3e4))
* **firestore:** options to include document ID on `valueChanges()` ([#2113](https://github.com/angular/angularfire/issues/2113)) ([09ed22a](https://github.com/angular/angularfire/commit/09ed22a))
* **functions:** Add options param to callable functions ([#2434](https://github.com/angular/angularfire/issues/2434)) ([f8d5a50](https://github.com/angular/angularfire/commit/f8d5a50)), closes [#2433](https://github.com/angular/angularfire/issues/2433)
* **schematics:** support `FIREBASE_TOKEN` for `ng deploy` ([#2327](https://github.com/angular/angularfire/issues/2327)) ([dd92869](https://github.com/angular/angularfire/commit/dd92869))
* **storage:** `getDownloadURL` pipe ([#2648](https://github.com/angular/angularfire/issues/2648)) ([0d799da](https://github.com/angular/angularfire/commit/0d799da))

<a name="6.1.0-rc.4"></a>
# [6.1.0-rc.4](https://github.com/angular/angularfire/compare/6.1.0-rc.3...6.1.0-rc.4) (2020-11-17)

### Bug Fixes

* **auth:** `ScreenTrackingService` will now wait for `UserTrackingService` to report an initial result, if `UserTrackingService` has been provided ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80))

### Features

* **core:** Adding global caches that survive/warn on HMR ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80)), closes [#2655](https://github.com/angular/angularfire/issues/2655)
* **auth:** Warn when using Auth emulator in conjunction with database or firestore, ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80)), closes [#2656](https://github.com/angular/angularfire/issues/2656)
* **auth:** Adding `AngularFireAuth.credential` an observer for `firebase.auth.UserCredential` ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80))
* **auth:** `ScreenTrackingService` now logs `sign_up` and `login` events ([#2661](https://github.com/angular/angularfire/issues/2661)) ([b666a80](https://github.com/angular/angularfire/commit/b666a80))

<a name="6.1.0-rc.3"></a>
# [6.1.0-rc.3](https://github.com/angular/angularfire/compare/6.1.0-rc.2...6.1.0-rc.3) (2020-11-14)

### Bug Fixes

* **analytics:** Bunch of analytics & screen tracking improvements ([#2654](https://github.com/angular/angularfire/pull/2654)) ([5bc159a](https://github.com/angular/angularfire/commit/5bc159a))

<a name="6.1.0-rc.2"></a>
# [6.1.0-rc.2](https://github.com/angular/angularfire/compare/6.1.0-rc.1...6.1.0-rc.2) (2020-11-13)


### Bug Fixes

* **fcm:** `tokenChanges` now listen for notification permission changes and trip token detection as expected ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))

### Features

* **database:** Added `USE_EMULATOR` DI token ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **fcm:** Added `VAPID_KEY`, `SERVICE_WORKER`, and `USE_EMULATOR` DI tokens ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **fcm:** `deleteToken`'s token argument is now optional, reflecting Firebase v8 changes ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **auth:** Added `SETTINGS`, `TENANT_ID`, `LANGUAGE_CODE`, `USE_DEVICE_LANGUAGE`, `USE_EMULATOR` and `PERSISTENCE` DI tokens ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **functions:** Added `USE_EMULATOR` and `NEW_ORIGIN_BEHAVIOR` DI token to opt-into the new way of setting `ORIGIN` ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **functions:** `httpsCallable` function now takes in `HttpsCallableOptions` ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))
* **storage:** Added `MAX_UPLOAD_RETRY_TIME` and `MAX_OPERATION_RETRY_TIME` DI tokens ([#2652](https://github.com/angular/angularfire/issues/2652)) ([8d3093f](https://github.com/angular/angularfire/commit/8d3093f))


<a name="6.1.0-rc.1"></a>
# [6.1.0-rc.1](https://github.com/angular/angularfire/compare/6.1.0-rc.0...6.1.0-rc.1) (2020-11-12)

### Bug Fixes

* **firestore:** doc and collection methods generic ([#2649](https://github.com/angular/angularfire/issues/2649)) ([796b7c1](https://github.com/angular/angularfire/commit/796b7c1))


### Features

* **firestore:** Inherit doc return type from class ([#2640](https://github.com/angular/angularfire/issues/2640)) ([f7bbd09](https://github.com/angular/angularfire/commit/f7bbd09))
* **firestore:** map document ID to the provided idField in a collection group query ([#2580](https://github.com/angular/angularfire/issues/2580)) ([dbf31d9](https://github.com/angular/angularfire/commit/dbf31d9))
* **auth-guard:** add support for specifying a `string` to redirect to ([#2448](https://github.com/angular/angularfire/issues/2448)) ([fe31191](https://github.com/angular/angularfire/commit/fe31191)), closes [#2287](https://github.com/angular/angularfire/issues/2287) [#2144](https://github.com/angular/angularfire/issues/2144)
* **database:** add option to include key on `valueChanges()` ([#2126](https://github.com/angular/angularfire/issues/2126)) ([5cdb8ce](https://github.com/angular/angularfire/commit/5cdb8ce))
* **deploy:** More deploy options ([#2647](https://github.com/angular/angularfire/issues/2647)) ([1bbd3e4](https://github.com/angular/angularfire/commit/1bbd3e4))
* **firestore:** options to include document ID on valueChanges() ([#2113](https://github.com/angular/angularfire/issues/2113)) ([09ed22a](https://github.com/angular/angularfire/commit/09ed22a))
* **functions:** Add options param to httpsCallable functions ([#2434](https://github.com/angular/angularfire/issues/2434)) ([f8d5a50](https://github.com/angular/angularfire/commit/f8d5a50)), closes [#2433](https://github.com/angular/angularfire/issues/2433)
* **schematics:** support FIREBASE_TOKEN for `ng deploy` ([#2327](https://github.com/angular/angularfire/issues/2327)) ([dd92869](https://github.com/angular/angularfire/commit/dd92869))
* **storage:** getDownloadURL pipe ([#2648](https://github.com/angular/angularfire/issues/2648)) ([0d799da](https://github.com/angular/angularfire/commit/0d799da))



<a name="6.1.0-rc.0"></a>
# [6.1.0-rc.0](https://github.com/angular/angularfire/compare/6.0.5...6.1.0-rc.0) (2020-11-11)


### Bug Fixes

* **deploy:** remove direct workspace access ([#2643](https://github.com/angular/angularfire/issues/2643)) ([7e1918a](https://github.com/angular/angularfire/commit/7e1918a))
* **schematics:** remove experimental workspace API type usage ([#2644](https://github.com/angular/angularfire/issues/2644)) ([b976c58](https://github.com/angular/angularfire/commit/b976c58))


### Features

* **core:** Support Angular 11


<a name="6.0.5"></a>
# [6.0.5](https://github.com/angular/angularfire/compare/6.0.4...6.0.5) (2020-11-10)


### Bug Fixes

* **core:** proxy-polyfill support and various other small fixes ([#2633](https://github.com/angular/angularfire/issues/2633)) ([af238cd](https://github.com/angular/angularfire/commit/af238cd))


<a name="6.0.4"></a>
# [6.0.4](https://github.com/angular/angularfire2/compare/6.0.3...6.0.4) (2020-10-30)


### Bug Fixes

* **analytics:** `UserTrackingService` and `ScreenTrackingService` should be opt-in, rather than opt-out ([#2605](https://github.com/angular/angularfire2/issues/2605)) ([92f7aaf](https://github.com/angular/angularfire2/commit/92f7aaf))
* **auth:** addressing observable errors in non-browser environments ([#2626](https://github.com/angular/angularfire2/issues/2626)) ([120c854](https://github.com/angular/angularfire2/commit/120c854))


### Features

* **core:** Support Firebase v8 ([#2624](https://github.com/angular/angularfire2/issues/2624)) ([082c0de](https://github.com/angular/angularfire2/commit/082c0de))



<a name="6.0.3"></a>
# [6.0.3](https://github.com/angular/angularfire2/compare/6.0.2...6.0.3) (2020-09-25)


### Bug Fixes

* **perf:** Fixing configuration regression with performance monitoring ([#2597](https://github.com/angular/angularfire2/issues/2597)) ([1608676](https://github.com/angular/angularfire2/commit/1608676))
* **fcm:** Fixing Zone.js and other various regressions ([#2597](https://github.com/angular/angularfire2/issues/2597)) ([1608676](https://github.com/angular/angularfire2/commit/1608676))
* **analytics:** Fix custom data layer function keeping Analytics from functioning ([#2594](https://github.com/angular/angularfire2/issues/2594)) ([77a9a15](https://github.com/angular/angularfire2/commit/77a9a15)), closes [#2505](https://github.com/angular/angularfire2/issues/2505)
* **core:** NG10-style ModuleWithProviders ([#2527](https://github.com/angular/angularfire2/issues/2527)) ([93912bc](https://github.com/angular/angularfire2/commit/93912bc))
* **core:** NG 10 support and various fixes ([#2522](https://github.com/angular/angularfire2/issues/2522)) ([7cb6c03](https://github.com/angular/angularfire2/commit/7cb6c03))

<a name="6.0.2"></a>
# [6.0.2](https://github.com/angular/angularfire2/compare/6.0.1...6.0.2) (2020-06-24)

* Quick fix to peers so `ng add @angular/fire` installs the correct version on Angular 10

<a name="6.0.1"></a>
# [6.0.1](https://github.com/angular/angularfire2/compare/6.0.0...6.0.1) (2020-06-24)

* Updating peer dependencies to allow for Angular 10
* `ng add @angular/fire` should correctly add the `firebase` peer
* `ng add @angular/fire` will not duplicate settings entries, if they're already present
* `ng add @angular/fire` will error if there are peer incompatabilities
* `ng deploy` should function correctly on Windows devices
* `ng deploy` will now mark the Angular assets as immutable on Firebase Hosting
* RTDB and Firestore CRUD operations should return in the ngZone
* Use of `AngularFireAuthGuard` should no longer destablize Zone.js

<a name="6.0.0"></a>
# [6.0.0](https://github.com/angular/angularfire2/compare/6.0.0-rc.2...6.0.0) (2020-04-01)

Final relase of version 6.

* Updating peer dependencies
* `ng add @angular/fire` now will overwrite firebase config, if present
* `ng add @angular/fire` now adds `@firebase/firestore` to the server schematic `externalDependencies` if present
* `ng deploy --preview` is now interactive and functions on non-SSR
* `ng deploy` will respect the `bundleDependencies` and `externalDependencies` server schematic options
* `ng deploy` now defaults to 1GB of ram on Cloud Functions
* Fixed various issues with functions deploy
* Simplified `AngularPerformanceMonitoring`

<a name="6.0.0-rc.2"></a>
# [6.0.0-rc.2](https://github.com/angular/angularfire2/compare/6.0.0-rc.1...6.0.0-rc.2) (2020-03-29)

Continued work on 6.0.

* Update peers
* No longer require developer add bare imports themselves (e.g, `import 'firebase/firestore'`)
* Zone.js fixes
* Angular Universal deploy schematic
* Storage listAll()

<a name="6.0.0-rc.1"></a>
# [6.0.0-rc.1](https://github.com/angular/angularfire2/compare/6.0.0-rc.0...6.0.0-rc.1) (2020-02-06)

Continued work on version 6.

* Brought a fix in `5.4.2` ([#2315](https://github.com/angular/angularfire2/issues/2315))
* Fixed `@angular/fire/analytics` attempting to use `global` ([#2303](https://github.com/angular/angularfire/issues/2303))
* Fix the error message on storage ([#2313](https://github.com/angular/angularfire/issues/2313))
* Starting on documentation for 6.0

<a name="6.0.0-rc.0"></a>
# [6.0.0-rc.0](https://github.com/angular/angularfire2/compare/5.4.1...6.0.0-rc.0) (2020-01-30)

Version 6 of AngularFire drops support for Angular version 8 and below, older versions of typescript, Firebase, drops `firebase-node`, `database-deprecated`, and more.

* Support for Angular versions less than 9 has been dropped
* Support for Firebase versions less than 7.8 has been dropped
* Support for `firebase-tools` less than 7.12 has been dropped
* `angularfire2` NPM shim will no longer be updated
* Dropped `@angular/fire/firebase-node` and `@angular/fire/database-depreciated`
* Using `ng-packagr` to build the library, bringing us back up to speed on APF
* All of our `@NgModules` are now `providedIn: 'any'` rather than singletons
* We make use of Proxy in more modules, you'll need to polyfill if you want to support IE 11

#### `@angular/fire`

* Dropped the `RealtimeDatabaseURL` and `DATABASE_URL` DI tokens, use `import { URL } from '@angular/fire/database'` instead
* Dropped `runOutsideAngular`, `runInZone`, `FirebaseZoneScheduler`, and the `Firebase*` type aliases

#### `@angular/fire/analytics`

* `AngularFireAnalytics` now memozies `analytics.Analtyics` instances keyed to the `measurementId`, this prevents exceptions if you're using more than one `FirebaseApp` with the same `measurementId`. This is also needed as we are `providedIn: 'any'`.

#### `@angular/fire/auth`

* `AngularFireAuthModule` is now side-effect free and `AngularFireAuth` will dynamically import `firebase/auth` when a request is made
* `AngularFireAuth` has dropped the `auth` property and instead Promise Proxies the underlying Firebase `auth.Auth` instance

#### `@angular/fire/auth-guard`

* `AngularFireAuthGuard` and `canActivate` have dropped (attempted) support for raw `AuthPipe`s, as they were not functioning in AOT builds; you'll want to move to `AuthPipeGenerator`s

#### `@angular/fire/database`

* `AngularFireDatabaseModule` no longer imports `firebase/database` on it's own to remain side-effect free, you'll need to `import 'firebase/database'` on your own
* Dropped the `RealtimeDatabaseURL` and `DATABASE_URL` DI tokens in favor of `URL`

#### `@angular/fire/firestore`

* `AngularFirestoreModule` no longer imports `firebase/firestore` on it's own to remain side-effect free, you'll need to `import 'firebase/firestore'` on your own
* Dropped the `EnablePersistenceToken` DI token in favor of `ENABLE_PERSISTENCE`
* Dropped the `PersistenceSettingsToken` DI token in favor of `PERSISTENCE_SETTINGS`
* Dropped the `FirestoreSettingsToken` DI token in favor of `SETTINGS`

#### `@angular/fire/functions`

* Dropped the `FunctionsRegionToken` and `FUNCTIONS_REGION` DI tokens in favor of `REGION`
* Dropped the `FUNCTIONS_ORIGIN` DI token in favor of `ORIGIN`
* `AngularFireFunctionsModule` is now side-effect free and `AngularFireFunctions` will dynamically import `firebase/functions` when a request is made
* `AngularFireFunctions` has dropped the `functions` property and instead Promise Proxies the underlying Firebase `functions.Functions` instance

#### `@angular/fire/messaging`

* `AngularFireMessaging`'s dynamic import of `firebase/messaging` is now lazy, if you don't call any methods the SDK will not be loaded
* `AngularFireMessaging` has dropped the `messaging` property and instead Promise Proxies the underlying Firebase `messaging.Messaging` instance

#### `@angular/fire/performance`

* `AngularFirePerformance` has dropped the `performance` property and instead Promise Proxies the underlying Firebase `performance.Performance` instance

#### `@angular/fire/storage`

* `AngularFireStorageModule` no longer imports `firebase/storage` on it's own to remain side-effect free, you'll need to `import 'firebase/storage'` on your own
* Dropped `StorageBucket` DI token in favor of `BUCKET`

<a name="5.4.2"></a>
# [5.4.2](https://github.com/angular/angularfire2/compare/5.4.1...5.4.2) (2020-02-06)

### Bug Fixes

* **core:** fixing a problem with hot/cold observables resulting in missed events ([#2315](https://github.com/angular/angularfire2/issues/2315)) ([f24df35](https://github.com/angular/angularfire2/commit/f24df35))


<a name="5.4.1"></a>
# [5.4.1](https://github.com/angular/angularfire2/compare/5.4.0...5.4.1) (2020-02-05)

### Bug Fixes

* **auth:** `authState` should be using `onAuthStateChanged` ([#2308](https://github.com/angular/angularfire2/issues/2308)) ([9506f85](https://github.com/angular/angularfire2/commit/9506f85))

<a name="5.4.0"></a>
# [5.4.0](https://github.com/angular/angularfire2/compare/5.3.1...5.4.0) (2020-02-01)

### Features

* **core:** Register AngularFire and Angular versions with the JS SDK ([6096c95](https://github.com/angular/angularfire2/commit/6096c95))
* **ng-deploy:** add option for buildTarget ([#2281](https://github.com/angular/angularfire2/issues/2281)) ([28a4e54](https://github.com/angular/angularfire2/commit/28a4e54))
* **core:** Major changes to the Zone.js wrapping to address SSR memory leaks and more ([#2294](https://github.com/angular/angularfire2/issues/2294)) ([56df941](https://github.com/angular/angularfire2/commit/56df941))


<a name="5.3.1"></a>
# [5.3.1](https://github.com/angular/angularfire2/compare/5.3.0...5.3.1) (2020-02-01)

### Bug Fixes
* **schematics**: The schematics should be functional again. The version of `firebase-tools` we were installing when you called `ng add @angular/fire` was using deprecated API. ([#2285](https://github.com/angular/angularfire2/issues/2285)) ([5867eeb](https://github.com/angular/angularfire2/commit/5867eebbd2ec7eaad0bbc8da94e38aca1fe7580b))
* **schematics**: fix issues with FS and Devkit Paths ([#2279](https://github.com/angular/angularfire2/issues/2279)) ([5ccf5db](https://github.com/angular/angularfire2/commit/5ccf5db3302be4a77529c33eda9ce39e5503b3c4))
* **rc**: Need to `ensureInitialized()` ([#2290](https://github.com/angular/angularfire2/issues/2290)) ([0d95523](https://github.com/angular/angularfire2/commit/0d955231a0c91d8abd4effe0e02044f40451a891))

<a name="5.3.0"></a>
# [5.3.0](https://github.com/angular/angularfire2/compare/5.2.3...5.3.0) (2020-01-07)

AngularFire 5.3 introduces [Analytics](docs/analytics/getting-started.md) and [Remote Config](docs/remote-config/getting-started.md) modules.

<a name="5.2.3"></a>
# [5.2.3](https://github.com/angular/angularfire2/compare/5.2.1...5.2.3) (2019-11-12)

### Bug Fixes

* **build:** Make the build work on windows ([#2231](https://github.com/angular/angularfire2/issues/2231)) ([97d8532](https://github.com/angular/angularfire2/commit/97d8532))
* **core:** Support Firebase 7 peer and fix zone instabilities with `AngularFirePerformanceModule` and the injectable `FirebaseApp` ([#2240](https://github.com/angular/angularfire2/issues/2240)) ([60fd575](https://github.com/angular/angularfire2/commit/60fd575))
* **rtdb:** Allow update to take "Partial<T>" ([#2169](https://github.com/angular/angularfire2/issues/2169)) ([ca43c8b](https://github.com/angular/angularfire2/commit/ca43c8b))

<a name="5.2.2"></a>
# [5.2.2](https://github.com/angular/angularfire2/compare/5.2.1...5.2.2) (2019-11-12)

`5.2.2` was mistakenly released to `@canary` due to a CI/CD bug. It was republished to `@latest` as `5.2.3`.

<a name="5.2.1"></a>
# [5.2.1](https://github.com/angular/angularfire2/compare/5.2.0...5.2.1) (2019-06-01)

Removed unnecessary `peerDependencies` ([#2095](https://github.com/angular/angularfire2/pull/2095)) ([5e49442](https://github.com/angular/angularfire2/pull/2095/commits/5e49442))

<a name="5.2.0"></a>
# [5.2.0](https://github.com/angular/angularfire2/compare/5.1.3...5.2.0) (2019-05-31)

AngularFire 5.2 introduces support for Angular 8 and version 6 of the Firebase SDK.

### Bug Fixes

* **firestore:** Fix for builds targeting Node ([#2079](https://github.com/angular/angularfire2/issues/2079)) ([8a33826](https://github.com/angular/angularfire2/commit/8a33826))
* **storage:** Typo in updateMetadata method ([#2029](https://github.com/angular/angularfire2/issues/2029)) ([6133296](https://github.com/angular/angularfire2/commit/6133296))
* **messaging:** Allow `AngularFireMessaging` to be included in a server build ([#1938](https://github.com/angular/angularfire2/issues/1938)) ([9b870a9](https://github.com/angular/angularfire2/commit/9b870a9))

### Features

* **performance:** AngularFire Performance Monitoring ([#2064](https://github.com/angular/angularfire2/issues/2064)) ([2469e77](https://github.com/angular/angularfire2/commit/2469e7721ffaea755ab6b95b66610e1495692342))
* **auth-guard:** AngularFire Auth Guards ([#2016](https://github.com/angular/angularfire2/issues/2016)) ([e32164d](https://github.com/angular/angularfire2/commit/e32164d))
* **firestore:** Added option to include document IDs on valueChanges() ([#1976](https://github.com/angular/angularfire2/issues/1976)) ([7108875](https://github.com/angular/angularfire2/commit/7108875))
* **firestore:** Support Firestore Collection Group Queries ([#2066](https://github.com/angular/angularfire2/issues/2066)) ([c34c0f3](https://github.com/angular/angularfire2/commit/c34c0f3))
* **functions:** Allow configuration of Functions Emulator Origin ([#2017](https://github.com/angular/angularfire2/issues/2017)) ([d12b4c5](https://github.com/angular/angularfire2/commit/d12b4c5))
* **schematics:** ng deploy schematic ([#2046](https://github.com/angular/angularfire2/issues/2046)) ([be0a1fb](https://github.com/angular/angularfire2/commit/be0a1fb))
* **firestore:** path on `AngularFirestoreCollection`'s `.doc` is optional ([#1974](https://github.com/angular/angularfire2/issues/1974)) ([c2354f8](https://github.com/angular/angularfire2/commit/c2354f8))


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
