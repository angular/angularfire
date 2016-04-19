System.register(['rxjs/Observable', './utils'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var Observable_1, utils;
    var FirebaseListObservable;
    return {
        setters:[
            function (Observable_1_1) {
                Observable_1 = Observable_1_1;
            },
            function (utils_1) {
                utils = utils_1;
            }],
        execute: function() {
            FirebaseListObservable = (function (_super) {
                __extends(FirebaseListObservable, _super);
                function FirebaseListObservable(subscribe, _ref) {
                    _super.call(this, subscribe);
                    this._ref = _ref;
                }
                FirebaseListObservable.prototype.lift = function (operator) {
                    var observable = new FirebaseListObservable();
                    observable.source = this;
                    observable.operator = operator;
                    observable._ref = this._ref;
                    return observable;
                };
                FirebaseListObservable.prototype.push = function (val) {
                    if (!this._ref) {
                        throw new Error('No ref specified for this Observable!');
                    }
                    return this._ref.push(val);
                };
                FirebaseListObservable.prototype.update = function (item, value) {
                    var _this = this;
                    return this._checkOperationCases(item, {
                        stringCase: function () { return _this._ref.child(item).update(value); },
                        firebaseCase: function () { return item.update(value); },
                        snapshotCase: function () { return item.ref().update(value); },
                        unwrappedSnapshotCase: function () { return _this._ref.child(item.$key).update(value); }
                    });
                };
                FirebaseListObservable.prototype.remove = function (item) {
                    // TODO: remove override when typings are updated to include
                    // remove() returning a promise.
                    var _this = this;
                    if (item === void 0) { item = null; }
                    // if no item parameter is provided, remove the whole list
                    if (!item) {
                        return this._ref.remove();
                    }
                    return this._checkOperationCases(item, {
                        stringCase: function () { return _this._ref.child(item).remove(); },
                        firebaseCase: function () { return item.remove(); },
                        snapshotCase: function () { return item.ref().remove(); },
                        unwrappedSnapshotCase: function () { return _this._ref.child(item.$key).remove(); }
                    });
                };
                FirebaseListObservable.prototype._checkOperationCases = function (item, cases) {
                    if (utils.isString(item)) {
                        return cases.stringCase();
                    }
                    else if (utils.isFirebaseRef(item)) {
                        // Firebase ref
                        return cases.firebaseCase();
                    }
                    else if (utils.isFirebaseDataSnapshot(item)) {
                        // Snapshot
                        return cases.snapshotCase();
                    }
                    else if (utils.isAFUnwrappedSnapshot(item)) {
                        // Unwrapped snapshot
                        return cases.unwrappedSnapshotCase();
                    }
                    throw new Error("FirebaseListObservable.remove requires a key, snapshot, reference, or unwrapped snapshot. Got: " + typeof item);
                };
                return FirebaseListObservable;
            })(Observable_1.Observable);
            exports_1("FirebaseListObservable", FirebaseListObservable);
        }
    }
});
