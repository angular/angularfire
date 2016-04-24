System.register(['angular2/core', '../tokens', '../utils/firebase_list_factory', '../utils/firebase_object_factory', '../utils/utils'], function(exports_1) {
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
    var core_1, tokens_1, firebase_list_factory_1, firebase_object_factory_1, utils;
    var FirebaseDatabase;
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
            function (tokens_1_1) {
                tokens_1 = tokens_1_1;
            },
            function (firebase_list_factory_1_1) {
                firebase_list_factory_1 = firebase_list_factory_1_1;
            },
            function (firebase_object_factory_1_1) {
                firebase_object_factory_1 = firebase_object_factory_1_1;
            },
            function (utils_1) {
                utils = utils_1;
            }],
        execute: function() {
            FirebaseDatabase = (function () {
                function FirebaseDatabase(fbUrl) {
                    this.fbUrl = fbUrl;
                }
                FirebaseDatabase.prototype.list = function (urlOrRef, opts) {
                    var _this = this;
                    return utils.checkForUrlOrFirebaseRef(urlOrRef, {
                        isUrl: function () { return firebase_list_factory_1.FirebaseListFactory(getAbsUrl(_this.fbUrl, urlOrRef), opts); },
                        isRef: function () { return firebase_list_factory_1.FirebaseListFactory(urlOrRef); }
                    });
                };
                FirebaseDatabase.prototype.object = function (urlOrRef, opts) {
                    var _this = this;
                    return utils.checkForUrlOrFirebaseRef(urlOrRef, {
                        isUrl: function () { return firebase_object_factory_1.FirebaseObjectFactory(getAbsUrl(_this.fbUrl, urlOrRef), opts); },
                        isRef: function () { return firebase_object_factory_1.FirebaseObjectFactory(urlOrRef); }
                    });
                };
                FirebaseDatabase = __decorate([
                    core_1.Injectable(),
                    __param(0, core_1.Inject(tokens_1.FirebaseUrl)), 
                    __metadata('design:paramtypes', [String])
                ], FirebaseDatabase);
                return FirebaseDatabase;
            })();
            exports_1("FirebaseDatabase", FirebaseDatabase);
        }
    }
});
