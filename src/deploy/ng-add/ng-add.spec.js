"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const ng_add_1 = require("./ng-add");
const PROJECT_NAME = 'pie-ka-chu';
const PROJECT_ROOT = 'pirojok';
const FIREBASE_PROJECT = 'pirojok-111e3';
const OTHER_PROJECT_NAME = 'pi-catch-you';
const OTHER_FIREBASE_PROJECT_NAME = 'bi-catch-you-77e7e';
describe('ng-add', () => {
    describe('generating files', () => {
        let tree;
        beforeEach(() => {
            tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify(generateAngularJson()));
        });
        it('generates new files if starting from scratch', () => __awaiter(this, void 0, void 0, function* () {
            const result = ng_add_1.ngAdd(tree, { firebaseProject: FIREBASE_PROJECT, project: PROJECT_NAME });
            expect(result.read('firebase.json').toString()).toMatchSnapshot();
            expect(result.read('.firebaserc').toString()).toMatchSnapshot();
            expect(result.read('angular.json').toString()).toMatchSnapshot();
        }));
        it('uses default project', () => __awaiter(this, void 0, void 0, function* () {
            const result = ng_add_1.ngAdd(tree, { firebaseProject: FIREBASE_PROJECT });
            expect(result.read('firebase.json').toString()).toMatchSnapshot();
            expect(result.read('.firebaserc').toString()).toMatchSnapshot();
            expect(result.read('angular.json').toString()).toMatchSnapshot();
        }));
        it('overrides existing files', () => __awaiter(this, void 0, void 0, function* () {
            const tempTree = ng_add_1.ngAdd(tree, { firebaseProject: FIREBASE_PROJECT, project: PROJECT_NAME });
            const result = ng_add_1.ngAdd(tempTree, { firebaseProject: OTHER_FIREBASE_PROJECT_NAME, project: OTHER_PROJECT_NAME });
            expect(result.read('firebase.json').toString()).toMatchSnapshot();
            expect(result.read('.firebaserc').toString()).toMatchSnapshot();
            expect(result.read('angular.json').toString()).toMatchSnapshot();
        }));
    });
    describe('error handling', () => {
        it('fails if project not defined', () => {
            const tree = schematics_1.Tree.empty();
            const angularJSON = generateAngularJson();
            delete angularJSON.defaultProject;
            tree.create('angular.json', JSON.stringify(angularJSON));
            expect(() => ng_add_1.ngAdd(tree, {
                firebaseProject: FIREBASE_PROJECT,
                project: ''
            })).toThrowError(/No project selected and no default project in the workspace/);
        });
        it('Should throw if angular.json not found', () => __awaiter(this, void 0, void 0, function* () {
            expect(() => ng_add_1.ngAdd(schematics_1.Tree.empty(), {
                firebaseProject: FIREBASE_PROJECT,
                project: PROJECT_NAME
            })).toThrowError(/Could not find angular.json/);
        }));
        it('Should throw if angular.json  can not be parsed', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', 'hi');
            expect(() => ng_add_1.ngAdd(tree, {
                firebaseProject: FIREBASE_PROJECT,
                project: PROJECT_NAME
            })).toThrowError(/Could not parse angular.json/);
        }));
        it('Should throw if specified project does not exist ', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify({ projects: {} }));
            expect(() => ng_add_1.ngAdd(tree, {
                firebaseProject: FIREBASE_PROJECT,
                project: PROJECT_NAME
            })).toThrowError(/Project is not defined in this workspace/);
        }));
        it('Should throw if specified project is not application', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify({ projects: { [PROJECT_NAME]: { projectType: 'pokemon' } } }));
            expect(() => ng_add_1.ngAdd(tree, {
                firebaseProject: FIREBASE_PROJECT,
                project: PROJECT_NAME
            })).toThrowError(/Deploy requires a project type of "application"/);
        }));
        it('Should throw if app does not have architect configured', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify({ projects: { [PROJECT_NAME]: { projectType: 'application' } } }));
            expect(() => ng_add_1.ngAdd(tree, {
                firebaseProject: FIREBASE_PROJECT,
                project: PROJECT_NAME
            })).toThrowError(/Cannot read the output path/);
        }));
        it('Should throw if firebase.json has the project already', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify(generateAngularJson()));
            const tempTree = ng_add_1.ngAdd(tree, { firebaseProject: FIREBASE_PROJECT, project: PROJECT_NAME });
            expect(() => ng_add_1.ngAdd(tempTree, {
                firebaseProject: FIREBASE_PROJECT,
                project: PROJECT_NAME
            })).toThrowError(/already exists in firebase.json/);
        }));
        it('Should throw if firebase.json is broken', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify(generateAngularJson()));
            tree.create('firebase.json', 'I\'m broken 😔');
            expect(() => ng_add_1.ngAdd(tree, {
                firebaseProject: FIREBASE_PROJECT,
                project: PROJECT_NAME
            })).toThrowError(/firebase.json: Unexpected token/);
        }));
        it('Should throw if .firebaserc is broken', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify(generateAngularJson()));
            tree.create('.firebaserc', 'I\'m broken 😔');
            expect(() => ng_add_1.ngAdd(tree, {
                firebaseProject: FIREBASE_PROJECT,
                project: PROJECT_NAME
            })).toThrowError(/.firebaserc: Unexpected token/);
        }));
        it('Should throw if firebase.json has the project already', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify(generateAngularJson()));
            const tempTree = ng_add_1.ngAdd(tree, { firebaseProject: FIREBASE_PROJECT, project: PROJECT_NAME });
            expect(() => ng_add_1.ngAdd(tempTree, {
                firebaseProject: FIREBASE_PROJECT,
                project: OTHER_PROJECT_NAME
            })).toThrowError(/ already defined in .firebaserc/);
        }));
        it('Should throw if firebase.json is broken', () => __awaiter(this, void 0, void 0, function* () {
            const tree = schematics_1.Tree.empty();
            tree.create('angular.json', JSON.stringify(generateAngularJson()));
            const tempTree = ng_add_1.ngAdd(tree, { firebaseProject: FIREBASE_PROJECT, project: PROJECT_NAME });
            expect(() => ng_add_1.ngAdd(tempTree, {
                firebaseProject: FIREBASE_PROJECT,
                project: OTHER_PROJECT_NAME
            })).toThrowError(/ already defined in .firebaserc/);
        }));
    });
});
function generateAngularJson() {
    return {
        defaultProject: PROJECT_NAME,
        projects: {
            [PROJECT_NAME]: {
                projectType: 'application',
                root: PROJECT_ROOT,
                architect: {
                    build: {
                        options: {
                            outputPath: 'dist/ikachu'
                        }
                    },
                }
            },
            [OTHER_PROJECT_NAME]: {
                projectType: 'application',
                root: PROJECT_ROOT,
                architect: {
                    build: {
                        options: {
                            outputPath: 'dist/ikachu'
                        }
                    },
                }
            }
        }
    };
}
//# sourceMappingURL=ng-add.spec.js.map
