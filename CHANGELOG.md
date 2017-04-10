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
