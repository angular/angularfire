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
