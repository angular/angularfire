System.register([], function(exports_1) {
    function isPresent(obj) {
        return obj !== undefined && obj !== null;
    }
    exports_1("isPresent", isPresent);
    function isString(value) {
        return typeof value === 'string';
    }
    exports_1("isString", isString);
    function isFirebaseRef(value) {
        return value instanceof Firebase;
    }
    exports_1("isFirebaseRef", isFirebaseRef);
    function isFirebaseQuery(value) {
        return typeof value.orderByChild === 'function';
    }
    exports_1("isFirebaseQuery", isFirebaseQuery);
    function isFirebaseDataSnapshot(value) {
        return typeof value.key === 'function';
    }
    exports_1("isFirebaseDataSnapshot", isFirebaseDataSnapshot);
    function isAFUnwrappedSnapshot(value) {
        return typeof value.$key === 'string';
    }
    exports_1("isAFUnwrappedSnapshot", isAFUnwrappedSnapshot);
    function checkForUrlOrFirebaseRef(urlOrRef, cases) {
        if (isString(urlOrRef)) {
            return cases.isUrl();
        }
        if (isFirebaseRef(urlOrRef)) {
            return cases.isRef();
        }
        if (isFirebaseQuery(urlOrRef)) {
            return cases.isRef();
        }
        throw new Error('Provide a url or a Firebase database reference');
    }
    exports_1("checkForUrlOrFirebaseRef", checkForUrlOrFirebaseRef);
    return {
        setters:[],
        execute: function() {
        }
    }
});
