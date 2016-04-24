System.register(['./firebase_object_observable', 'firebase', './utils'], function(exports_1) {
    var firebase_object_observable_1, Firebase, utils;
    function FirebaseObjectFactory(absoluteUrlOrDbRef, _a) {
        var preserveSnapshot = (_a === void 0 ? {} : _a).preserveSnapshot;
        var ref;
        utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
            isUrl: function () { return ref = new Firebase(absoluteUrlOrDbRef); },
            isRef: function () { return ref = absoluteUrlOrDbRef; }
        });
        return new firebase_object_observable_1.FirebaseObjectObservable(function (obs) {
            ref.on('value', function (snapshot) {
                obs.next(preserveSnapshot ? snapshot : snapshot.val());
            });
            return function () { return ref.off(); };
        }, ref);
    }
    exports_1("FirebaseObjectFactory", FirebaseObjectFactory);
    return {
        setters:[
            function (firebase_object_observable_1_1) {
                firebase_object_observable_1 = firebase_object_observable_1_1;
            },
            function (Firebase_1) {
                Firebase = Firebase_1;
            },
            function (utils_1) {
                utils = utils_1;
            }],
        execute: function() {
        }
    }
});
