import {experimental, JsonObject, logging} from '@angular-devkit/core';
import { BuilderContext, BuilderRun, ScheduleOptions, Target, } from '@angular-devkit/architect';
import {FirebaseTools, FirebaseDeployConfig, BuildTarget, FSHost} from '../interfaces';
import deploy, {deployToFunction} from './actions';


let context: BuilderContext;
let firebaseMock: FirebaseTools;
let fsHost: FSHost;

const FIREBASE_PROJECT = 'ikachu-aa3ef';
const PROJECT = 'pirojok-project';
const BUILD_TARGET: BuildTarget = {
  name: `${PROJECT}:build:production`
};

const projectTargets: experimental.workspace.WorkspaceTool = {
  build: {
    options: {
      outputPath: 'dist/browser'
    }
  },
  server: {
    options: {
      outputPath: 'dist/server'
    }
  }
};

describe('Deploy Angular apps', () => {
  beforeEach(() => initMocks());

  it('should call login', async () => {
    const spy = spyOn(firebaseMock, 'login');
    await deploy(firebaseMock, context, projectTargets, [BUILD_TARGET], FIREBASE_PROJECT, false);
    expect(spy).toHaveBeenCalled();
  });

  it('should invoke the builder', async () => {
    const spy = spyOn(context, 'scheduleTarget').and.callThrough();
    await deploy(firebaseMock, context, projectTargets, [BUILD_TARGET], FIREBASE_PROJECT, false);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({
      target: 'build',
      configuration: 'production',
      project: PROJECT
    }, undefined);
  });

  it('should allow the buildTarget to be specified', async () => {
    const buildTarget = {
      name: `${PROJECT}:prerender`,
      options: {}
    };
    const spy = spyOn(context, 'scheduleTarget').and.callThrough();
    await deploy(firebaseMock, context, projectTargets, [buildTarget], FIREBASE_PROJECT, false);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({ target: 'prerender', project: PROJECT }, {});
  });

  it('should invoke firebase.deploy', async () => {
    const spy = spyOn(firebaseMock, 'deploy').and.callThrough();
    await deploy(firebaseMock, context, projectTargets, [BUILD_TARGET], FIREBASE_PROJECT, false);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({
      cwd: 'cwd',
      only: 'hosting: ' + PROJECT
    });
  });

  describe('error handling',  () => {
    it('throws if there is no firebase project', async () => {
      try {
        await deploy(firebaseMock, context, projectTargets, [BUILD_TARGET], undefined, false);
      } catch (e) {
        console.log(e);
        expect(e.message).toMatch(/Cannot find firebase project/);
      }
    });

    it('throws if there is no target project', async () => {
      context.target = undefined;
      try {
        await deploy(firebaseMock, context, projectTargets, [BUILD_TARGET], FIREBASE_PROJECT, false)
      } catch (e) {
        expect(e.message).toMatch(/Cannot execute the build target/);
      }
    });
  });
});

describe('universal deployment', () => {
  beforeEach(() => initMocks());

  it('should create a firebase function', async () => {
    const spy = spyOn(fsHost, 'writeFileSync');
    await deployToFunction(firebaseMock, context, '/home/user', projectTargets, fsHost);

    expect(spy).toHaveBeenCalledTimes(2);

    const packageArgs = spy.calls.argsFor(0);
    const functionArgs = spy.calls.argsFor(1);

    expect(packageArgs[0]).toBe('dist/package.json');
    expect(functionArgs[0]).toBe('dist/index.js');
  });

  it('should rename the index.html file in the nested dist', async () => {
    const spy = spyOn(fsHost, 'renameSync');
    await deployToFunction(firebaseMock, context, '/home/user', projectTargets, fsHost);

    expect(spy).toHaveBeenCalledTimes(1);

    const packageArgs = spy.calls.argsFor(0);

    expect(packageArgs).toEqual([
      'dist/dist/browser/index.html',
      'dist/dist/browser/index.original.html'
    ]);
  });

  it('should invoke firebase.deploy', async () => {
    const spy = spyOn(firebaseMock, 'deploy');
    await deployToFunction(firebaseMock, context, '/home/user', projectTargets, fsHost);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

const initMocks = () => {
  fsHost = {
    moveSync(_: string, __: string) {
    },
    renameSync(_: string, __: string) {
    },
    writeFileSync(_: string, __: string) {
    }
  };

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
