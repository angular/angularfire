"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var child_process_1 = require("child_process");
var fs_extra_1 = require("fs-extra");
var pretty_size_1 = require("pretty-size");
var gzip_size_1 = require("gzip-size");
var path_1 = require("path");
var src = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return path_1.join.apply(void 0, __spreadArrays([process.cwd(), 'src'], args));
};
var dest = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return path_1.join.apply(void 0, __spreadArrays([process.cwd(), 'dist', 'packages-dist'], args));
};
var rootPackage = Promise.resolve().then(function () { return require(path_1.join(process.cwd(), 'package.json')); });
function replacePackageJsonVersions() {
    return __awaiter(this, void 0, void 0, function () {
        var path, root, pkg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    path = dest('package.json');
                    return [4 /*yield*/, rootPackage];
                case 1:
                    root = _a.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return require(path); })];
                case 2:
                    pkg = _a.sent();
                    Object.keys(pkg.peerDependencies).forEach(function (peer) {
                        pkg.peerDependencies[peer] = root.dependencies[peer];
                    });
                    pkg.version = root.version;
                    return [2 /*return*/, fs_extra_1.writeFile(path, JSON.stringify(pkg, null, 2))];
            }
        });
    });
}
function replaceSchematicVersions() {
    return __awaiter(this, void 0, void 0, function () {
        var root, path, dependencies;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, rootPackage];
                case 1:
                    root = _a.sent();
                    path = dest('schematics', 'versions.json');
                    return [4 /*yield*/, Promise.resolve().then(function () { return require(path); })];
                case 2:
                    dependencies = _a.sent();
                    Object.keys(dependencies["default"]).forEach(function (name) {
                        dependencies["default"][name].version = root.dependencies[name] || root.devDependencies[name];
                    });
                    return [2 /*return*/, fs_extra_1.writeFile(path, JSON.stringify(dependencies, null, 2))];
            }
        });
    });
}
function spawnPromise(command, args) {
    return new Promise(function (resolve) { return child_process_1.spawn(command, args, { stdio: 'inherit' }).on('close', resolve); });
}
function compileSchematics() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, spawnPromise("npx", ['tsc', '-p', src('schematics', 'tsconfig.json')])];
                case 1:
                    _a.sent();
                    return [2 /*return*/, Promise.all([
                            fs_extra_1.copy(src('core', 'builders.json'), dest('builders.json')),
                            fs_extra_1.copy(src('core', 'collection.json'), dest('collection.json')),
                            fs_extra_1.copy(src('schematics', 'deploy', 'schema.json'), dest('deploy', 'schema.json')),
                            replaceSchematicVersions()
                        ])];
            }
        });
    });
}
function replaceDynamicImportsForUMD() {
    return __awaiter(this, void 0, void 0, function () {
        var perfPath, messagingPath, _a, perf, messaging;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    perfPath = dest('bundles', 'angular-fire-performance.umd.js');
                    messagingPath = dest('bundles', 'angular-fire-messaging.umd.js');
                    return [4 /*yield*/, Promise.all([
                            fs_extra_1.readFile(perfPath, 'utf8'),
                            fs_extra_1.readFile(messagingPath, 'utf8')
                        ])];
                case 1:
                    _a = _b.sent(), perf = _a[0], messaging = _a[1];
                    return [2 /*return*/, Promise.all([
                            fs_extra_1.writeFile(perfPath, perf.replace("rxjs.from(import('firebase/performance'))", "rxjs.empty()")),
                            fs_extra_1.writeFile(messagingPath, messaging.replace("rxjs.from(import('firebase/messaging'))", "rxjs.empty()"))
                        ])];
            }
        });
    });
}
function measure(module) {
    return __awaiter(this, void 0, void 0, function () {
        var path, file, gzip, size;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    path = dest('bundles', module + ".umd.js");
                    return [4 /*yield*/, fs_extra_1.readFile(path)];
                case 1:
                    file = _a.sent();
                    gzip = pretty_size_1.prettySize(gzip_size_1.sync(file), true);
                    size = pretty_size_1.prettySize(file.byteLength, true);
                    return [2 /*return*/, { size: size, gzip: gzip }];
            }
        });
    });
}
function buildLibrary() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, spawnPromise('npx', ['ng', 'build'])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            fs_extra_1.copy(path_1.join(process.cwd(), '.npmignore'), dest('.npmignore')),
                            fs_extra_1.copy(path_1.join(process.cwd(), 'README.md'), dest('README.md')),
                            fs_extra_1.copy(path_1.join(process.cwd(), 'docs'), dest('docs')),
                            fs_extra_1.copy(src('firebase-node'), dest('firebase-node')),
                            compileSchematics(),
                            replacePackageJsonVersions(),
                            replaceDynamicImportsForUMD()
                        ])];
                case 2:
                    _a.sent();
                    return [2 /*return*/, Promise.all([
                            measure('angular-fire'),
                            measure('angular-fire-analytics'),
                            measure('angular-fire-auth'),
                            measure('angular-fire-auth-guard'),
                            measure('angular-fire-database'),
                            measure('angular-fire-firestore'),
                            measure('angular-fire-functions'),
                            measure('angular-fire-remote-config'),
                            measure('angular-fire-storage'),
                            measure('angular-fire-messaging'),
                            measure('angular-fire-performance')
                        ])];
            }
        });
    });
}
function buildWrapper() {
    return __awaiter(this, void 0, void 0, function () {
        var root, path, pkg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs_extra_1.copy(src('wrapper'), path_1.join(process.cwd(), 'dist', 'wrapper-dist'))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, rootPackage];
                case 2:
                    root = _a.sent();
                    path = path_1.join(process.cwd(), 'dist', 'wrapper-dist', 'package.json');
                    return [4 /*yield*/, Promise.resolve().then(function () { return require(path); })];
                case 3:
                    pkg = _a.sent();
                    pkg.dependencies['@angular/fire'] = pkg.version = root.version;
                    return [2 /*return*/, fs_extra_1.writeFile(path, JSON.stringify(pkg, null, 2))];
            }
        });
    });
}
buildLibrary().then(function (stats) {
    var line = 0;
    console.log("\nPackage      Size     Gzipped\n-----------------------------\nCore         " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nAnalytics    " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nAuth         " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nAuthGuard    " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nDatabase     " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nFirestore    " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nFunctions    " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nRemoteConfig " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nStorage      " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nMessaging    " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\nPerformance  " + stats[line].size.padEnd(8) + " " + stats[line++].gzip + "\n  ");
    return buildWrapper();
});
