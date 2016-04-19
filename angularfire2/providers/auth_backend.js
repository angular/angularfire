System.register([], function(exports_1) {
    var AuthBackend, AuthProviders, AuthMethods;
    function authDataToAuthState(authData) {
        var auth = authData.auth, uid = authData.uid, provider = authData.provider, github = authData.github, twitter = authData.twitter, facebook = authData.facebook, google = authData.google, password = authData.password, anonymous = authData.anonymous;
        var authState = { auth: auth, uid: uid, expires: authData.expires, provider: null };
        switch (provider) {
            case 'github':
                authState.github = github;
                authState.provider = AuthProviders.Github;
                break;
            case 'twitter':
                authState.twitter = twitter;
                authState.provider = AuthProviders.Twitter;
                break;
            case 'facebook':
                authState.facebook = facebook;
                authState.provider = AuthProviders.Facebook;
                break;
            case 'google':
                authState.google = google;
                authState.provider = AuthProviders.Google;
                break;
            case 'password':
                authState.password = password;
                authState.provider = AuthProviders.Password;
                break;
            case 'anonymous':
                authState.anonymous = anonymous;
                authState.provider = AuthProviders.Anonymous;
                break;
            case 'custom':
                authState.provider = AuthProviders.Custom;
                break;
            default:
                throw new Error("Unsupported firebase auth provider " + provider);
        }
        return authState;
    }
    exports_1("authDataToAuthState", authDataToAuthState);
    return {
        setters:[],
        execute: function() {
            AuthBackend = (function () {
                function AuthBackend() {
                }
                return AuthBackend;
            })();
            exports_1("AuthBackend", AuthBackend);
            (function (AuthProviders) {
                AuthProviders[AuthProviders["Github"] = 0] = "Github";
                AuthProviders[AuthProviders["Twitter"] = 1] = "Twitter";
                AuthProviders[AuthProviders["Facebook"] = 2] = "Facebook";
                AuthProviders[AuthProviders["Google"] = 3] = "Google";
                AuthProviders[AuthProviders["Password"] = 4] = "Password";
                AuthProviders[AuthProviders["Anonymous"] = 5] = "Anonymous";
                AuthProviders[AuthProviders["Custom"] = 6] = "Custom";
            })(AuthProviders || (AuthProviders = {}));
            exports_1("AuthProviders", AuthProviders);
            ;
            (function (AuthMethods) {
                AuthMethods[AuthMethods["Popup"] = 0] = "Popup";
                AuthMethods[AuthMethods["Redirect"] = 1] = "Redirect";
                AuthMethods[AuthMethods["Anonymous"] = 2] = "Anonymous";
                AuthMethods[AuthMethods["Password"] = 3] = "Password";
                AuthMethods[AuthMethods["OAuthToken"] = 4] = "OAuthToken";
                AuthMethods[AuthMethods["CustomToken"] = 5] = "CustomToken";
            })(AuthMethods || (AuthMethods = {}));
            exports_1("AuthMethods", AuthMethods);
            ;
        }
    }
});
