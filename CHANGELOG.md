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
