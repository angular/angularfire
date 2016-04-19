System.register(['angular2/core', './providers/auth', 'firebase', './utils/firebase_list_observable', './utils/firebase_object_observable', './utils/firebase_list_factory', './utils/firebase_object_factory', './tokens', './providers/auth_backend', './providers/firebase_sdk_auth_backend', './database/database'], function(exports_1) {
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var __param = (this && this.__param) || function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };
    var core_1, auth_1, Firebase, firebase_list_observable_1, firebase_object_observable_1, firebase_list_factory_1, firebase_object_factory_1, tokens_1, auth_backend_1, firebase_sdk_auth_backend_1, database_1;
    var AngularFire, COMMON_PROVIDERS, FIREBASE_PROVIDERS, defaultFirebase;
    function getAbsUrl(root, url) {
        if (!(/^[a-z]+:\/\/.*/.test(url))) {
            // Provided url is relative.
            url = root + url;
        }
        return url;
    }
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (auth_1_1) {
                auth_1 = auth_1_1;
            },
            function (Firebase_1) {
                Firebase = Firebase_1;
            },
            function (firebase_list_observable_1_1) {
                firebase_list_observable_1 = firebase_list_observable_1_1;
            },
            function (firebase_object_observable_1_1) {
                firebase_object_observable_1 = firebase_object_observable_1_1;
            },
            function (firebase_list_factory_1_1) {
                firebase_list_factory_1 = firebase_list_factory_1_1;
            },
            function (firebase_object_factory_1_1) {
                firebase_object_factory_1 = firebase_object_factory_1_1;
            },
            function (tokens_1_1) {
                tokens_1 = tokens_1_1;
                exports_1({
                    "FirebaseUrl": tokens_1_1["FirebaseUrl"],
                    "FirebaseRef": tokens_1_1["FirebaseRef"],
                    "FirebaseAuthConfig": tokens_1_1["FirebaseAuthConfig"]
                });
            },
            function (auth_backend_1_1) {
                auth_backend_1 = auth_backend_1_1;
            },
            function (firebase_sdk_auth_backend_1_1) {
                firebase_sdk_auth_backend_1 = firebase_sdk_auth_backend_1_1;
            },
            function (database_1_1) {
                database_1 = database_1_1;
            }],
        execute: function() {
            AngularFire = (function () {
                function AngularFire(fbUrl, auth, database) {
                    this.fbUrl = fbUrl;
                    this.auth = auth;
                    this.database = database;
                    this.list = database.list.bind(database);
                    this.object = database.object.bind(database);
                }
                AngularFire = __decorate([
                    core_1.Injectable(),
                    __param(0, core_1.Inject(tokens_1.FirebaseUrl)), 
                    __metadata('design:paramtypes', [String, auth_1.FirebaseAuth, database_1.FirebaseDatabase])
                ], AngularFire);
                return AngularFire;
            })();
            exports_1("AngularFire", AngularFire);
            exports_1("COMMON_PROVIDERS", COMMON_PROVIDERS = [
                core_1.provide(tokens_1.FirebaseRef, {
                    useFactory: function (url) { return new Firebase(url); },
                    deps: [tokens_1.FirebaseUrl] }),
                auth_1.FirebaseAuth,
                AngularFire,
                database_1.FirebaseDatabase
            ]);
            exports_1("FIREBASE_PROVIDERS", FIREBASE_PROVIDERS = [
                COMMON_PROVIDERS,
                core_1.provide(auth_backend_1.AuthBackend, {
                    useFactory: function (ref) { return new firebase_sdk_auth_backend_1.FirebaseSdkAuthBackend(ref, false); },
                    deps: [tokens_1.FirebaseRef]
                })
            ]);
            /**
             * Used to define the default Firebase root location to be
             * used throughout an application.
             */
            exports_1("defaultFirebase", defaultFirebase = function (url) {
                return core_1.provide(tokens_1.FirebaseUrl, {
                    useValue: url
                });
            });
            exports_1("FirebaseAuth", auth_1.FirebaseAuth);
            exports_1("FirebaseDatabase", database_1.FirebaseDatabase);
            exports_1("FirebaseListObservable", firebase_list_observable_1.FirebaseListObservable);
            exports_1("FirebaseObjectObservable", firebase_object_observable_1.FirebaseObjectObservable);
            exports_1("FirebaseListFactory", firebase_list_factory_1.FirebaseListFactory);
            exports_1("FirebaseObjectFactory", firebase_object_factory_1.FirebaseObjectFactory);
            exports_1("firebaseAuthConfig", auth_1.firebaseAuthConfig);
            exports_1("AuthMethods", auth_backend_1.AuthMethods);
            exports_1("AuthProviders", auth_backend_1.AuthProviders);
            exports_1("default",{
                providers: FIREBASE_PROVIDERS
            });
        }
    }
});
