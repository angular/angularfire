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
const deploy_1 = require("../deploy");
const core_1 = require("@angular-devkit/core");
let context;
let firebaseMock;
const FIREBASE_PROJECT = 'ikachu-aa3ef';
const PROJECT = 'pirojok-project';
describe('Deploy Angular apps', () => {
    beforeEach(() => initMocks());
    it('should check if the user is authenticated by invoking list', () => __awaiter(this, void 0, void 0, function* () {
        const spy = spyOn(firebaseMock, 'list');
        const spyLogin = spyOn(firebaseMock, 'login');
        yield deploy_1.default(firebaseMock, context, 'host', FIREBASE_PROJECT);
        expect(spy).toHaveBeenCalled();
        expect(spyLogin).not.toHaveBeenCalled();
    }));
    it('should invoke login if list rejects', () => __awaiter(this, void 0, void 0, function* () {
        firebaseMock.list = () => Promise.reject();
        const spy = spyOn(firebaseMock, 'list').and.callThrough();
        const spyLogin = spyOn(firebaseMock, 'login');
        yield deploy_1.default(firebaseMock, context, 'host', FIREBASE_PROJECT);
        expect(spy).toHaveBeenCalled();
        expect(spyLogin).toHaveBeenCalled();
    }));
    it('should invoke the builder', () => __awaiter(this, void 0, void 0, function* () {
        const spy = spyOn(context, 'scheduleTarget').and.callThrough();
        yield deploy_1.default(firebaseMock, context, 'host', FIREBASE_PROJECT);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            target: 'build',
            configuration: 'production',
            project: PROJECT
        });
    }));
    it('should invoke firebase.deploy', () => __awaiter(this, void 0, void 0, function* () {
        const spy = spyOn(firebaseMock, 'deploy').and.callThrough();
        yield deploy_1.default(firebaseMock, context, 'host', FIREBASE_PROJECT);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            cwd: 'host', only: 'hosting:' + PROJECT
        });
    }));
    describe('error handling', () => {
        it('throws if there is no firebase project', () => __awaiter(this, void 0, void 0, function* () {
            expect(deploy_1.default(firebaseMock, context, 'host')).rejects.toThrow(/Cannot find firebase project/);
        }));
        it('throws if there is no target project', () => __awaiter(this, void 0, void 0, function* () {
            context.target = undefined;
            expect(deploy_1.default(firebaseMock, context, 'host', FIREBASE_PROJECT)).rejects.toThrow(/Cannot execute the build target/);
        }));
    });
});
const initMocks = () => {
    firebaseMock = {
        login: () => Promise.resolve(),
        list: () => Promise.resolve([]),
        deploy: (_) => Promise.resolve(),
        use: jest.fn()
    };
    context = {
        target: {
            configuration: 'production',
            project: PROJECT,
            target: 'foo'
        },
        builder: {
            builderName: 'mock',
            description: 'mock',
            optionSchema: false
        },
        currentDirectory: 'cwd',
        id: 1,
        logger: new core_1.logging.Logger('mock'),
        workspaceRoot: 'cwd',
        getTargetOptions: (_) => Promise.resolve({}),
        reportProgress: (_, __, ___) => {
        },
        reportStatus: (_) => {
        },
        reportRunning: () => {
        },
        scheduleBuilder: (_, __, ___) => Promise.resolve({}),
        scheduleTarget: (_, __, ___) => Promise.resolve({})
    };
};
//# sourceMappingURL=deploy.spec.js.map