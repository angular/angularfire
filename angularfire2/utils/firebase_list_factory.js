System.register(['./firebase_list_observable', 'firebase', './utils'], function(exports_1) {
    var firebase_list_observable_1, Firebase, utils;
    function FirebaseListFactory(absoluteUrlOrDbRef, _a) {
        var preserveSnapshot = (_a === void 0 ? {} : _a).preserveSnapshot;
        var ref;
        utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
            isUrl: function () { return ref = new Firebase(absoluteUrlOrDbRef); },
            isRef: function () { return ref = absoluteUrlOrDbRef; }
        });
        // if (utils.isString(absoluteUrlOrDbRef)) {  
        //   ref = new Firebase(<string>absoluteUrlOrDbRef);
        // } else {
        //   ref = <Firebase>absoluteUrlOrDbRef;
        // }
        return new firebase_list_observable_1.FirebaseListObservable(function (obs) {
            var arr = [];
            var hasInitialLoad = false;
            // The list should only emit after the initial load
            // comes down from the Firebase database, (e.g.) all
            // the initial child_added events have fired.
            // This way a complete array is emitted which leads
            // to better rendering performance
            ref.once('value', function (snap) {
                hasInitialLoad = true;
                obs.next(preserveSnapshot ? arr : arr.map(unwrapMapFn));
            });
            ref.on('child_added', function (child, prevKey) {
                arr = onChildAdded(arr, child, prevKey);
                // only emit the array after the initial load
                if (hasInitialLoad) {
                    obs.next(preserveSnapshot ? arr : arr.map(unwrapMapFn));
                }
            });
            ref.on('child_removed', function (child) {
                arr = onChildRemoved(arr, child);
                if (hasInitialLoad) {
                    obs.next(preserveSnapshot ? arr : arr.map(unwrapMapFn));
                }
            });
            ref.on('child_changed', function (child, prevKey) {
                arr = onChildChanged(arr, child, prevKey);
                if (hasInitialLoad) {
                    // This also manages when the only change is prevKey change
                    obs.next(preserveSnapshot ? arr : arr.map(unwrapMapFn));
                }
            });
            return function () { return ref.off(); };
        }, ref);
    }
    exports_1("FirebaseListFactory", FirebaseListFactory);
    function unwrapMapFn(snapshot) {
        var unwrapped = snapshot.val();
        if ((/string|number|boolean/).test(typeof unwrapped)) {
            unwrapped = {
                $value: unwrapped
            };
        }
        unwrapped.$key = snapshot.key();
        return unwrapped;
    }
    exports_1("unwrapMapFn", unwrapMapFn);
    function onChildAdded(arr, child, prevKey) {
        if (!arr.length) {
            return [child];
        }
        return arr.reduce(function (accumulator, curr, i) {
            if (!prevKey && i === 0) {
                accumulator.push(child);
            }
            accumulator.push(curr);
            if (prevKey && prevKey === curr.key()) {
                accumulator.push(child);
            }
            return accumulator;
        }, []);
    }
    exports_1("onChildAdded", onChildAdded);
    function onChildChanged(arr, child, prevKey) {
        return arr.reduce(function (accumulator, val, i) {
            if (!prevKey && i == 0) {
                accumulator.push(child);
                accumulator.push(val);
            }
            else if (val.key() === prevKey) {
                accumulator.push(val);
                accumulator.push(child);
            }
            else if (val.key() !== child.key()) {
                accumulator.push(val);
            }
            return accumulator;
        }, []);
    }
    exports_1("onChildChanged", onChildChanged);
    function onChildRemoved(arr, child) {
        return arr.filter(function (c) { return c.key() !== child.key(); });
    }
    exports_1("onChildRemoved", onChildRemoved);
    function onChildUpdated(arr, child, prevKey) {
        return arr.map(function (v, i, arr) {
            if (!prevKey && !i) {
                return child;
            }
            else if (i > 0 && arr[i - 1].key() === prevKey) {
                return child;
            }
            else {
                return v;
            }
        });
    }
    exports_1("onChildUpdated", onChildUpdated);
    return {
        setters:[
            function (firebase_list_observable_1_1) {
                firebase_list_observable_1 = firebase_list_observable_1_1;
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
