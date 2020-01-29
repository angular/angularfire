import { JsonObject, logging } from '@angular-devkit/core';
import { BuilderContext, BuilderRun, ScheduleOptions, Target, } from '@angular-devkit/architect';
import { FirebaseTools, FirebaseDeployConfig } from '../interfaces';
import deploy from './actions';


let context: BuilderContext;
let firebaseMock: FirebaseTools;

const FIREBASE_PROJECT = 'ikachu-aa3ef';
const PROJECT = 'pirojok-project';

describe('Deploy Angular apps', () => {
  beforeEach(() => initMocks());

  it('should call login', async () => {
    const spy = spyOn(firebaseMock, 'login');
    await deploy(firebaseMock, context, 'host', FIREBASE_PROJECT);
    expect(spy).toHaveBeenCalled();
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

  describe('error handling',  () => {
    it('throws if there is no firebase project', async () => {
      try {
        await deploy(firebaseMock, context, 'host')
        fail();
      } catch (e) {
        expect(e.message).toMatch(/Cannot find firebase project/);
      }
    });

    it('throws if there is no target project', async () => {
      context.target = undefined;
      try {
        await deploy(firebaseMock, context, 'host', FIREBASE_PROJECT)
        fail();
      } catch (e) {
        expect(e.message).toMatch(/Cannot execute the build target/);
      }
    });
  });
});

const initMocks = () => {
  firebaseMock = {
    login: () => Promise.resolve(),
    projects: {
      list: () => Promise.resolve([]),
    },
    deploy: (_: FirebaseDeployConfig) => Promise.resolve(),
    use: () => Promise.resolve()
  };

  context = <any>{
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
    logger: new logging.NullLogger() as any,
    workspaceRoot: 'cwd',
    getTargetOptions: (_: Target) => Promise.resolve({}),
      reportProgress: (_: number, __?: number, ___?: string) => {
    },
    reportStatus: (_: string) => {},
    reportRunning: () => {},
    scheduleBuilder: (_: string, __?: JsonObject, ___?: ScheduleOptions) => Promise.resolve({} as BuilderRun),
    scheduleTarget: (_: Target, __?: JsonObject, ___?: ScheduleOptions) => Promise.resolve({} as BuilderRun)
  };
};