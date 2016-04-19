System.register(['angular2/core'], function(exports_1) {
    var core_1;
    var FirebaseUrl, FirebaseRef, FirebaseAuthConfig;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            }],
        execute: function() {
            exports_1("FirebaseUrl", FirebaseUrl = new core_1.OpaqueToken('FirebaseUrl'));
            exports_1("FirebaseRef", FirebaseRef = new core_1.OpaqueToken('FirebaseRef'));
            exports_1("FirebaseAuthConfig", FirebaseAuthConfig = new core_1.OpaqueToken('FirebaseAuthConfig'));
        }
    }
});
