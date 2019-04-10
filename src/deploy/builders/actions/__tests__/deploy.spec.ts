import deploy from '../deploy';

import { JsonObject, logging } from '@angular-devkit/core';
import { BuilderContext, BuilderRun, ScheduleOptions, Target, } from '@angular-devkit/architect/src/index2';
import { FirebaseDeployConfig, FirebaseTools } from '../../../shared/types';


let context: BuilderContext;
let firebaseMock: FirebaseTools;

const FIREBASE_PROJECT = 'ikachu-aa3ef';
const PROJECT = 'pirojok-project';

describe('Deploy Angular apps', () => {
    beforeEach(() => initMocks());

    it('should check if the user is authenticated by invoking list', async () => {
        const spy = spyOn(firebaseMock, 'list');
        const spyLogin = spyOn(firebaseMock, 'login');
        await deploy(firebaseMock, context, 'host', FIREBASE_PROJECT);
        expect(spy).toHaveBeenCalled();
        expect(spyLogin).not.toHaveBeenCalled();
    });

    it('should invoke login if list rejects', async () => {
        firebaseMock.list = () => Promise.reject();
        const spy = spyOn(firebaseMock, 'list').and.callThrough();
        const spyLogin = spyOn(firebaseMock, 'login');
        await deploy(firebaseMock, context, 'host', FIREBASE_PROJECT);
        expect(spy).toHaveBeenCalled();
        expect(spyLogin).toHaveBeenCalled();
    });

    it('should invoke the builder', async () => {
        const spy = spyOn(context, 'scheduleTarget').and.callThrough();
        await deploy(firebaseMock, context, 'host', FIREBASE_PROJECT);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            target: 'build',
            configuration: 'production',
            project: PROJECT
        });
    });

    it('should invoke firebase.deploy', async () => {
        const spy = spyOn(firebaseMock, 'deploy').and.callThrough();
        await deploy(firebaseMock, context, 'host', FIREBASE_PROJECT);
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            cwd: 'host', only: 'hosting:' + PROJECT
        });
    });

    describe('error handling', () => {
        it('throws if there is no firebase project', async () => {
            expect(deploy(firebaseMock, context, 'host')).rejects.toThrow(/Cannot find firebase project/);
        });

        it('throws if there is no target project', async () => {
            context.target = undefined;
            expect(deploy(firebaseMock, context, 'host', FIREBASE_PROJECT)).rejects.toThrow(/Cannot execute the build target/);
        });
    });
});

const initMocks = () => {
    firebaseMock = {
        login: () => Promise.resolve(),
        list: () => Promise.resolve([]),
        deploy: (_: FirebaseDeployConfig) => Promise.resolve(),
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
        logger: new logging.Logger('mock'),
        workspaceRoot: 'cwd',
        getTargetOptions: (_: Target) => Promise.resolve({}),
        reportProgress: (_: number, __?: number, ___?: string) => {
        },
        reportStatus: (_: string) => {
        },
        reportRunning: () => {
        },
        scheduleBuilder: (_: string, __?: JsonObject, ___?: ScheduleOptions) => Promise.resolve({} as BuilderRun),
        scheduleTarget: (_: Target, __?: JsonObject, ___?: ScheduleOptions) => Promise.resolve({} as BuilderRun)
    };
};
