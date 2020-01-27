"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
// TODO infer these from the package.json
var MODULES = [
    'core', 'analytics', 'auth', 'auth-guard', 'database',
    'database-deprecated', 'firestore', 'functions', 'remote-config',
    'storage', 'messaging', 'performance'
];
var UMD_NAMES = MODULES.map(function (m) { return m === 'core' ? 'angular-fire' : "angular-fire-" + m; });
var ENTRY_NAMES = MODULES.map(function (m) { return m === 'core' ? '@angular/fire' : "@angular/fire/" + m; });
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
function measure(module) {
    return __awaiter(this, void 0, void 0, function () {
        var path, file, gzip, size;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    path = dest('bundles', module + ".umd.min.js");
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
                            replacePackageJsonVersions()
                        ])];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function measureLibrary() {
    return Promise.all(UMD_NAMES.map(measure));
}
function buildDocs() {
    return __awaiter(this, void 0, void 0, function () {
        var entries, root, pipes, tocType, table_of_contents, afdoc;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // INVESTIGATE json to stdout rather than FS?
                return [4 /*yield*/, Promise.all(MODULES.map(function (module) { return spawnPromise('npx', ['typedoc', "./src/" + module, '--json', "./dist/typedocs/" + module + ".json"]); }))];
                case 1:
                    // INVESTIGATE json to stdout rather than FS?
                    _a.sent();
                    return [4 /*yield*/, Promise.all(MODULES.map(function (module, index) { return __awaiter(_this, void 0, void 0, function () {
                            var buffer, typedoc, entryPoint, allChildren;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fs_extra_1.readFile("./dist/typedocs/" + module + ".json")];
                                    case 1:
                                        buffer = _a.sent();
                                        typedoc = JSON.parse(buffer.toString());
                                        entryPoint = typedoc.children.find(function (c) { return c.name === "\"public_api\""; });
                                        allChildren = [].concat.apply([], typedoc.children.map(function (child) {
                                            // TODO chop out the working directory and filename
                                            return child.children ? child.children.map(function (c) { return (__assign(__assign({}, c), { path: path_1.dirname(child.originalName.split(process.cwd())[1]) })); }) : [];
                                        }));
                                        return [2 /*return*/, entryPoint.children
                                                .filter(function (c) { return c.name[0] !== 'ɵ' && c.name[0] !== '_'; } /* private */)
                                                .map(function (child) { return (__assign({}, allChildren.find(function (c) { return child.target === c.id; }))); })
                                                .reduce(function (acc, child) {
                                                var _a;
                                                return (__assign(__assign({}, acc), (_a = {}, _a[encodeURIComponent(child.name)] = child, _a)));
                                            }, {})];
                                }
                            });
                        }); }))];
                case 2:
                    entries = _a.sent();
                    return [4 /*yield*/, rootPackage];
                case 3:
                    root = _a.sent();
                    pipes = ['MonoTypeOperatorFunction', 'OperatorFunction', 'AuthPipe', 'UnaryFunction'];
                    tocType = function (child) {
                        var decorators = child.decorators && child.decorators.map(function (d) { return d.name; }) || [];
                        if (decorators.includes('NgModule')) {
                            return 'NgModule';
                        }
                        else if (child.kindString === 'Type alias') {
                            return 'Type alias';
                        }
                        else if (child.kindString === 'Variable' && child.defaultValue && child.defaultValue.startsWith('new InjectionToken')) {
                            return 'InjectionToken';
                        }
                        else if (child.type) {
                            return pipes.includes(child.type.name) ? 'Pipe' : child.type.name;
                        }
                        else if (child.signatures && child.signatures[0] && child.signatures[0].type && pipes.includes(child.signatures[0].type.name)) {
                            return 'Pipe';
                        }
                        else {
                            return child.kindString;
                        }
                    };
                    table_of_contents = entries.reduce(function (acc, entry, index) {
                        var _a;
                        return (__assign(__assign({}, acc), (_a = {}, _a[MODULES[index]] = { name: ENTRY_NAMES[index], exports: Object.keys(entry).reduce(function (acc, key) {
                                var _a;
                                return (__assign(__assign({}, acc), (_a = {}, _a[key] = tocType(entry[key]), _a)));
                            }, {}) }, _a)));
                    }, {});
                    afdoc = entries.reduce(function (acc, entry, index) {
                        var _a;
                        return (__assign(__assign({}, acc), (_a = {}, _a[MODULES[index]] = entry, _a)));
                    }, { table_of_contents: table_of_contents });
                    return [2 /*return*/, fs_extra_1.writeFile("./api-" + root.version + ".json", JSON.stringify(afdoc, null, 2))];
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
function packLibrary() {
    return spawnPromise('npm', ['pack', './dist/packages-dist']);
}
Promise.all([
    buildWrapper(),
    buildDocs(),
    buildLibrary().then(packLibrary)
]).then(measureLibrary).then(function (stats) {
    return console.log("\nPackage             Size     Gzipped\n------------------------------------\n" + stats.map(function (s, i) { return [MODULES[i].padEnd(20), s.size.padEnd(8), s.gzip].join(""); }).join("\n"));
});
