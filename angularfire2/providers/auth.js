System.register(['angular2/core', 'rxjs/subject/ReplaySubject', '../tokens', '../utils/utils', './auth_backend'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
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
    var core_1, ReplaySubject_1, tokens_1, utils_1, auth_backend_1;
    var kBufferSize, firebaseAuthConfig, FirebaseAuth;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (ReplaySubject_1_1) {
                ReplaySubject_1 = ReplaySubject_1_1;
            },
            function (tokens_1_1) {
                tokens_1 = tokens_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (auth_backend_1_1) {
                auth_backend_1 = auth_backend_1_1;
            }],
        execute: function() {
            kBufferSize = 1;
            exports_1("firebaseAuthConfig", firebaseAuthConfig = function (config) {
                return core_1.provide(tokens_1.FirebaseAuthConfig, {
                    useValue: config
                });
            });
            FirebaseAuth = (function (_super) {
                __extends(FirebaseAuth, _super);
                function FirebaseAuth(_authBackend, _config) {
                    var _this = this;
                    _super.call(this, kBufferSize);
                    this._authBackend = _authBackend;
                    this._config = _config;
                    this._authBackend.onAuth(function (authData) { return _this._emitAuthData(authData); });
                }
                FirebaseAuth.prototype.login = function (obj1, obj2) {
                    var config = null;
                    var credentials = null;
                    if (arguments.length > 2) {
                        return this._reject('Login only accepts a maximum of two arguments.');
                    }
                    else if (arguments.length == 2) {
                        credentials = obj1;
                        config = obj2;
                    }
                    else if (arguments.length == 1) {
                        // Check if obj1 is password credentials
                        if (obj1.password && obj1.email) {
                            credentials = obj1;
                            config = {};
                        }
                        else {
                            config = obj1;
                        }
                    }
                    config = this._mergeConfigs(config);
                    if (!utils_1.isPresent(config.method)) {
                        return this._reject('You must provide a login method');
                    }
                    var providerMethods = [auth_backend_1.AuthMethods.Popup, auth_backend_1.AuthMethods.Redirect, auth_backend_1.AuthMethods.OAuthToken];
                    if (providerMethods.indexOf(config.method) != -1) {
                        if (!utils_1.isPresent(config.provider)) {
                            return this._reject('You must include a provider to use this auth method.');
                        }
                    }
                    var credentialsMethods = [auth_backend_1.AuthMethods.Password, auth_backend_1.AuthMethods.OAuthToken, auth_backend_1.AuthMethods.CustomToken];
                    if (credentialsMethods.indexOf(config.method) != -1) {
                        if (!credentials) {
                            return this._reject('You must include credentials to use this auth method.');
                        }
                    }
                    switch (config.method) {
                        case auth_backend_1.AuthMethods.Popup:
                            return this._authBackend.authWithOAuthPopup(config.provider, this._scrubConfig(config));
                        case auth_backend_1.AuthMethods.Redirect:
                            return this._authBackend.authWithOAuthRedirect(config.provider, this._scrubConfig(config));
                        case auth_backend_1.AuthMethods.Anonymous:
                            return this._authBackend.authAnonymously(this._scrubConfig(config));
                        case auth_backend_1.AuthMethods.Password:
                            return this._authBackend.authWithPassword(credentials, this._scrubConfig(config, false));
                        case auth_backend_1.AuthMethods.OAuthToken:
                            return this._authBackend.authWithOAuthToken(config.provider, credentials, this._scrubConfig(config));
                        case auth_backend_1.AuthMethods.CustomToken:
                            return this._authBackend.authWithCustomToken(credentials.token, this._scrubConfig(config, false));
                    }
                };
                FirebaseAuth.prototype.logout = function () {
                    if (this._authBackend.getAuth() !== null) {
                        this._authBackend.unauth();
                    }
                };
                FirebaseAuth.prototype.getAuth = function () {
                    return this._authBackend.getAuth();
                };
                FirebaseAuth.prototype.createUser = function (credentials) {
                    return this._authBackend.createUser(credentials);
                };
                /**
                 * Merges the config object that is passed in with the configuration
                 * provided through DI. Giving precendence to the one that was passed.
                 */
                FirebaseAuth.prototype._mergeConfigs = function (config) {
                    if (this._config == null)
                        return config;
                    return Object.assign({}, this._config, config);
                };
                FirebaseAuth.prototype._reject = function (msg) {
                    return new Promise(function (res, rej) {
                        return rej(msg);
                    });
                };
                FirebaseAuth.prototype._scrubConfig = function (config, scrubProvider) {
                    if (scrubProvider === void 0) { scrubProvider = true; }
                    var scrubbed = Object.assign({}, config);
                    if (scrubProvider) {
                        delete scrubbed.provider;
                    }
                    delete scrubbed.method;
                    return scrubbed;
                };
                FirebaseAuth.prototype._emitAuthData = function (authData) {
                    if (authData == null) {
                        this.next(null);
                    }
                    else {
                        this.next(auth_backend_1.authDataToAuthState(authData));
                    }
                };
                FirebaseAuth = __decorate([
                    core_1.Injectable(),
                    __param(1, core_1.Optional()),
                    __param(1, core_1.Inject(tokens_1.FirebaseAuthConfig)), 
                    __metadata('design:paramtypes', [auth_backend_1.AuthBackend, Object])
                ], FirebaseAuth);
                return FirebaseAuth;
            })(ReplaySubject_1.ReplaySubject);
            exports_1("FirebaseAuth", FirebaseAuth);
        }
    }
});
