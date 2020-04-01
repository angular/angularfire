# Upgrading to AngularFire 6.0

Intended to be run with Angular 9; version 6 of AngularFire drops support for Angular version 8 and below, older versions of typescript, Firebase, drops `firebase-node`, `database-deprecated`, and more.

## Breaking changes:

* Support for Angular versions less than 9 has been dropped
* Support for Firebase JS SDK versions less than 7.13.1 has been dropped
* Support for `firebase-tools` less than 8.0 has been dropped
* The `angularfire2` NPM library will no longer be updated
* Dropped `@angular/fire/firebase-node` and `@angular/fire/database-depreciated`
* We make use of Proxy in more modules, you'll need to polyfill if you want to support IE 11
* We've standardized our DI Token naming conventions across all modules
* `AngularFireAuth` has dropped the `auth` property and instead Promise Proxies the underlying Firebase `auth.Auth` instance; allowing your development experience to more closely mirror the JS SDK. Similar changes have been made to `AngularFireFunctions`, `AngularFireMessaging`, and `AngularFirePerformance`.
* `AngularFireAuthGuard` and `canActivate` have dropped support for raw pipes, this was never working correctly in AOT
