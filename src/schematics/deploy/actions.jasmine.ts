/* eslint-disable @typescript-eslint/no-empty-function */
import { join } from 'path';
import { BuilderContext, BuilderRun, ScheduleOptions, Target } from '@angular-devkit/architect';
import { JsonObject, logging } from '@angular-devkit/core';
import { BuildTarget, FSHost, FirebaseDeployConfig, FirebaseTools } from '../interfaces';
import deploy, { deployToFunction } from './actions'
import 'jasmine';

let context: BuilderContext;
let firebaseMock: FirebaseTools;
let fsHost: FSHost;

const FIREBASE_PROJECT = 'ikachu-aa3ef';
const PROJECT = 'pirojok-project';
const STATIC_BUILD_TARGET: BuildTarget = {
  name: `${PROJECT}:build:production`
};

const FIREBASE_TOKEN = 'kkasllkascnkjnskjsdcskdckskdksdkjc';

const SERVER_BUILD_TARGET: BuildTarget = {
  name: `${PROJECT}:server:production`
};

const login = () => Promise.resolve({ user: { email: 'foo@bar.baz' }});
login.list = () => Promise.resolve([{ user: { email: 'foo@bar.baz' }}]);
login.add = () => Promise.resolve([{ user: { email: 'foo@bar.baz' }}]);
login.use = () => Promise.resolve('foo@bar.baz');

const workspaceRoot = join('home', 'user');

const initMocks = () => {
  fsHost = {
    moveSync(_: string, __: string) {
    },
    renameSync(_: string, __: string) {
    },
    writeFileSync(_: string, __: string) {
    },
    copySync(_: string, __: string) {
    },
    removeSync(_: string) {
    },
    existsSync(_: string) {
      return false;
    },
  };

  firebaseMock = {
    login,
    projects: {
      list: () => Promise.resolve([]),
      create: () => Promise.reject(),
    },
    apps: {
      list: () => Promise.resolve([]),
      create: () => Promise.reject(),
      sdkconfig: () => Promise.resolve({ fileName: '_', fileContents: '', sdkConfig: {}, }),
    },
    hosting: {
      sites: {
        list: () => Promise.resolve({sites: []}),
        create: () => Promise.reject(),
      }
    },
    deploy: (_: FirebaseDeployConfig) => Promise.resolve(),
    use: () => Promise.resolve(),
    logger: {
      add: () => { },
      logger: {
        add: () => { }
      }
    },
    cli: { version: () => '9.0.0' },
    serve: () => Promise.resolve()
  };

  context = ({
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
    getTargetOptions: (target: Target) => {
      if (target.target === 'build') {
        return { outputPath: 'dist/browser' };
      } else if (target.target === 'server') {
        return { outputPath: 'dist/server' };
      }
    },
    reportProgress: (_: number, __?: number, ___?: string) => {
    },
    reportStatus: (_: string) => {
    },
    reportRunning: () => {
    },
    scheduleBuilder: (_: string, __?: JsonObject, ___?: ScheduleOptions) => Promise.resolve({} as BuilderRun),
    scheduleTarget: (_: Target, __?: JsonObject, ___?: ScheduleOptions) => Promise.resolve({} as BuilderRun)
  } as any);
};

describe('Deploy Angular apps', () => {
  beforeEach(() => initMocks());

  it('should call login', async () => {
    const spy = spyOn(firebaseMock, 'login').and.resolveTo({ email: 'foo@bar.baz' });
    await deploy(
      firebaseMock, context, STATIC_BUILD_TARGET, undefined,
      undefined, undefined, { projectId: FIREBASE_PROJECT, preview: false }
    );
    expect(spy).toHaveBeenCalled();
  });

  it('should not call login', async () => {
    const spy = spyOn(firebaseMock, 'login');
    await deploy(firebaseMock, context, STATIC_BUILD_TARGET, undefined,  undefined, undefined, { preview: false }, FIREBASE_TOKEN);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should invoke the builder', async () => {
    const spy = spyOn(context, 'scheduleTarget').and.callThrough();
    await deploy(firebaseMock, context, STATIC_BUILD_TARGET, undefined,  undefined, undefined, { preview: false });
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
    await deploy(firebaseMock, context, buildTarget, undefined,  undefined, undefined, { preview: false });
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({ target: 'prerender', project: PROJECT }, {});
  });

  it('should invoke firebase.deploy', async () => {
    const spy = spyOn(firebaseMock, 'deploy').and.callThrough();
    await deploy(firebaseMock, context, STATIC_BUILD_TARGET, undefined,  undefined, undefined, { preview: false }, FIREBASE_TOKEN);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({
      cwd: 'cwd',
      only: 'hosting:' + PROJECT,
      token: FIREBASE_TOKEN,
      nonInteractive: true,
      projectRoot: 'cwd',
    });
  });

  describe('error handling', () => {
    it('throws if there is no firebase project', async () => {
      try {
        await deploy(firebaseMock, context, STATIC_BUILD_TARGET, undefined, undefined, undefined, { preview: false  });
      } catch (e) {
        expect(e.message).toMatch(/Cannot find firebase project/);
      }
    });

    it('throws if there is no target project', async () => {
      context.target = undefined;
      try {
        await deploy(firebaseMock, context, STATIC_BUILD_TARGET, undefined, undefined, undefined, { preview: false });
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
    await deployToFunction(
      firebaseMock,
      context,
      workspaceRoot,
      STATIC_BUILD_TARGET,
      SERVER_BUILD_TARGET,
      { preview: false  },
      undefined,
      fsHost
    );

    expect(spy).toHaveBeenCalledTimes(2);

    const packageArgs = spy.calls.argsFor(0);
    const functionArgs = spy.calls.argsFor(1);

    expect(packageArgs[0]).toBe(join(workspaceRoot, 'dist', 'package.json'));
    expect(functionArgs[0]).toBe(join(workspaceRoot, 'dist', 'index.js'));
  });

  it('should create a firebase function (new)', async () => {
    const spy = spyOn(fsHost, 'writeFileSync');
    await deployToFunction(
      firebaseMock,
      context,
      workspaceRoot,
      STATIC_BUILD_TARGET,
      SERVER_BUILD_TARGET,
      { preview: false, outputPath: join('dist', 'functions') },
      undefined,
      fsHost
    );

    expect(spy).toHaveBeenCalledTimes(2);

    const packageArgs = spy.calls.argsFor(0);
    const functionArgs = spy.calls.argsFor(1);

    expect(packageArgs[0]).toBe(join(workspaceRoot, 'dist', 'functions', 'package.json'));
    expect(functionArgs[0]).toBe(join(workspaceRoot, 'dist', 'functions', 'index.js'));
  });

  it('should rename the index.html file in the nested dist', async () => {
    const spy = spyOn(fsHost, 'renameSync');
    await deployToFunction(
      firebaseMock,
      context,
      workspaceRoot,
      STATIC_BUILD_TARGET,
      SERVER_BUILD_TARGET,
      { preview: false  },
      undefined,
      fsHost
    );

    expect(spy).toHaveBeenCalledTimes(1);

    const packageArgs = spy.calls.argsFor(0);

    expect(packageArgs).toEqual([
      join(workspaceRoot, 'dist', 'dist', 'browser', 'index.html'),
      join(workspaceRoot, 'dist', 'dist', 'browser', 'index.original.html')
    ]);
  });

  it('should rename the index.html file in the nested dist (new)', async () => {
    const spy = spyOn(fsHost, 'renameSync');
    await deployToFunction(
      firebaseMock,
      context,
      workspaceRoot,
      STATIC_BUILD_TARGET,
      SERVER_BUILD_TARGET,
      { preview: false, outputPath: join('dist', 'functions') },
      undefined,
      fsHost
    );

    expect(spy).toHaveBeenCalledTimes(1);

    const packageArgs = spy.calls.argsFor(0);

    expect(packageArgs).toEqual([
      join(workspaceRoot, 'dist', 'functions', 'dist', 'browser', 'index.html'),
      join(workspaceRoot, 'dist', 'functions', 'dist', 'browser', 'index.original.html')
    ]);
  });

  it('should invoke firebase.deploy', async () => {
    const spy = spyOn(firebaseMock, 'deploy');
    await deployToFunction(
      firebaseMock,
      context,
      workspaceRoot,
      STATIC_BUILD_TARGET,
      SERVER_BUILD_TARGET,
      { preview: false },
      undefined,
      fsHost
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  /* TODO figure out how to stub the prompt
  it('should not deploy if the command is invoked with --preview', async () => {
    const spy = spyOn(firebaseMock, 'deploy');
    await deployToFunction(firebaseMock, context, '/home/user', projectTargets, true, fsHost);
    expect(spy).not.toHaveBeenCalled();
  });*/
});
