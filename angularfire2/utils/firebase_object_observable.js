System.register(['rxjs/Observable'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var Observable_1;
    var FirebaseObjectObservable;
    return {
        setters:[
            function (Observable_1_1) {
                Observable_1 = Observable_1_1;
            }],
        execute: function() {
            FirebaseObjectObservable = (function (_super) {
                __extends(FirebaseObjectObservable, _super);
                function FirebaseObjectObservable(subscribe, _ref) {
                    _super.call(this, subscribe);
                    this._ref = _ref;
                }
                FirebaseObjectObservable.prototype.lift = function (operator) {
                    var observable = new FirebaseObjectObservable();
                    observable.source = this;
                    observable.operator = operator;
                    observable._ref = this._ref;
                    return observable;
                };
                FirebaseObjectObservable.prototype.set = function (value) {
                    if (!this._ref) {
                        throw new Error('No ref specified for this Observable!');
                    }
                    return this._ref.set(value);
                };
                FirebaseObjectObservable.prototype.update = function (value) {
                    if (!this._ref) {
                        throw new Error('No ref specified for this Observable!');
                    }
                    return this._ref.update(value);
                };
                FirebaseObjectObservable.prototype.remove = function () {
                    if (!this._ref) {
                        throw new Error('No ref specified for this Observable!');
                    }
                    return this._ref.remove();
                };
                return FirebaseObjectObservable;
            })(Observable_1.Observable);
            exports_1("FirebaseObjectObservable", FirebaseObjectObservable);
        }
    }
});
