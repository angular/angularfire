import { SpawnOptionsWithoutStdio, SpawnSyncOptions, spawn } from 'child_process';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { BuilderContext, targetFromTargetString } from '@angular-devkit/architect';
import { SchematicsException } from '@angular-devkit/schematics';
import crossSpawn from 'cross-spawn';
import fsExtra from 'fs-extra';
import * as inquirer from 'inquirer';
import open from 'open';
import { satisfies } from 'semver';
import tripleBeam from 'triple-beam';
import * as winston from 'winston';
import { BuildTarget, CloudRunOptions, DeployBuilderSchema, FSHost, FirebaseTools } from '../interfaces';
import { DEFAULT_FUNCTION_NAME, defaultFunction, defaultPackage, dockerfile, functionGen2 } from './functions-templates.js';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore `import.meta` is rejected by the --module es2015 pass of `npm run build:jasmine`.
const moduleDirectory = typeof __dirname === 'string' ? __dirname : dirname(fileURLToPath(import.meta.url));

const { copySync, removeSync, readJsonSync } = fsExtra;

const DEFAULT_EMULATOR_PORT = 5000;
const DEFAULT_EMULATOR_HOST = 'localhost';

const DEFAULT_CLOUD_RUN_OPTIONS: Partial<CloudRunOptions> = {
  memory: '1Gi',
  timeout: 60,
  maxInstances: 'default',
  maxConcurrency: 'default', // TODO tune concurrency for cloud run + angular
  minInstances: 'default',
  cpus: 1,
};

const spawnAsync = async (
  command: string,
  args: string[],
  options?: SpawnOptionsWithoutStdio
) =>
  new Promise<Buffer>((resolve, reject) => {
    const spawnProcess = spawn(command, args, options);
    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];
    spawnProcess.stdout.on('data', (data) => {
      process.stdout.write(data.toString());
      chunks.push(data);
    });
    spawnProcess.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
      errorChunks.push(data);
    });
    spawnProcess.on('error', (error) => {
      reject(error);
    });
    spawnProcess.on('close', (code) => {
      if (code !== 0) {
        reject(Buffer.concat(errorChunks).toString());
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });

export type DeployBuilderOptions = DeployBuilderSchema & Record<string, any>;

const escapeRegExp = (str: string) => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');

const moveSync = (src: string, dest: string) => {
  copySync(src, dest);
  removeSync(src);
};

const deployToHosting = async (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string,
  options: DeployBuilderOptions,
  firebaseToken?: string,
) => {

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const siteTarget = options.target ?? context.target!.project;

  if (options.preview) {

    await firebaseTools.serve({
      port: DEFAULT_EMULATOR_PORT,
      host: DEFAULT_EMULATOR_HOST,
      only: `hosting:${siteTarget}`,
      nonInteractive: true,
      projectRoot: workspaceRoot,
    });

    const { deployProject } = await inquirer.prompt({
      type: 'confirm',
      name: 'deployProject',
      message: 'Would you like to deploy your application to Firebase Hosting?'
    }) as { deployProject: boolean };

    if (!deployProject) { return; }

    process.env.FIREBASE_FRAMEWORKS_SKIP_BUILD = 'true';

  }

  return await firebaseTools.deploy({
    only: `hosting:${siteTarget}`,
    cwd: workspaceRoot,
    token: firebaseToken,
    nonInteractive: true,
    projectRoot: workspaceRoot,
  });

};

const defaultFsHost: FSHost = {
  moveSync,
  writeFileSync,
  renameSync,
  copySync,
  removeSync,
  existsSync,
};

// Package managers AngularFire is willing to shell out to when resolving
// dependency versions. Kept in sync with the Angular CLI's own list. The value
// comes from `cli.packageManager` in angular.json, which this builder reads with
// a raw `JSON.parse`, i.e. it is NOT run through the Angular CLI's own schema
// validation, so it must be checked here before it is ever used as an argv0.
export const SUPPORTED_PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm', 'cnpm', 'bun'];

export const assertSupportedPackageManager = (packageManager: string): string => {
  if (!SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
    throw new SchematicsException(
      `Unsupported package manager "${packageManager}" in angular.json (cli.packageManager). ` +
      `Expected one of: ${SUPPORTED_PACKAGE_MANAGERS.join(', ')}.`
    );
  }
  return packageManager;
};

// A dependency name comes from `architect.<project>.server.options.externalDependencies`
// in angular.json. Reject anything that is not a plain package specifier so it can
// neither inject shell metacharacters (defence in depth alongside execFileSync) nor
// be parsed as a CLI flag by the package manager (argument injection).
export const assertSafeDependencyName = (name: string): string => {
  // Valid npm package names / esbuild external globs never contain whitespace or
  // shell metacharacters, and never start with a dash. Reject anything else so the
  // value can neither inject a shell command (defence in depth alongside
  // execFileSync) nor be parsed as a package-manager flag (argument injection).
  if (typeof name !== 'string' || name.length === 0 || name.startsWith('-') ||
      /[\s;&|$`(){}<>!\\'"]/.test(name)) {
    throw new SchematicsException(
      `Invalid dependency name ${JSON.stringify(name)} in angular.json (server externalDependencies).`
    );
  }
  return name;
};

// All shelling out from the deploy builder funnels through this single runner.
// cross-spawn (v7) resolves the platform-appropriate executable and escapes each
// argument, so a value taken from angular.json is passed as an argv entry and can
// never be parsed as shell syntax. Unlike child_process.execFile it can launch a
// Windows `.cmd`/`.bat` shim (npm, yarn, pnpm and cnpm all ship as `.cmd` shims
// there), so `ng deploy` keeps working cross-platform. We deliberately avoid
// `shell: true`, whose args-array form Node runtime-deprecates (DEP0190) because
// it concatenates the arguments without escaping, reopening the injection.
// It is exported as an object so tests can assert the deploy code shells out only
// through here and never regresses to execSync or `shell: true`.
export const processHost = {
  runPackageBin(
    command: string,
    args: string[],
    options: SpawnSyncOptions = {},
  ): Buffer {
    const result = crossSpawn.sync(command, args, options);
    if (result.error) { throw result.error; }
    if (result.status !== 0) {
      throw new SchematicsException(
        `Command "${command}" exited with ${result.signal ? `signal ${result.signal}` : `code ${result.status}`}.`
      );
    }
    return result.stdout;
  },
};

export const findPackageVersion = (packageManager: string, name: string) => {
  // Run the package manager without a shell (argument array, no `shell` option)
  // so a dependency name or package-manager value taken from angular.json cannot
  // be interpreted as a shell command. Both values are validated first, so an
  // unsupported manager or unsafe name throws before anything is ever spawned.
  const output = processHost.runPackageBin(assertSupportedPackageManager(packageManager), [
    'list',
    assertSafeDependencyName(name),
  ]).toString();
  const match = output.match(`[^|s]${escapeRegExp(name)}[@| ][^s]+(s.+)?$`);
  return match ? match[0].split(new RegExp(`${escapeRegExp(name)}[@| ]`))[1].split(/\s/)[0] : null;
};

const getPackageJson = (context: BuilderContext, workspaceRoot: string, options: DeployBuilderOptions, main?: string) => {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  const { firebaseFunctionsDependencies } = readJsonSync(join(moduleDirectory, '..', 'versions.json'));
  if (options.ssr !== 'cloud-run') {
    Object.keys(firebaseFunctionsDependencies).forEach(name => {
      const { version, dev } = firebaseFunctionsDependencies[name];
      (dev ? devDependencies : dependencies)[name] = version;
    });
  }
  if (existsSync(join(workspaceRoot, 'angular.json'))) {
    const angularJson = JSON.parse(readFileSync(join(workspaceRoot, 'angular.json')).toString());
    const packageManager = angularJson.cli?.packageManager ?? 'npm';
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const server = angularJson.projects[context.target!.project].architect.server;
    const externalDependencies = server?.options?.externalDependencies || [];
    const bundleDependencies = server?.options?.bundleDependencies ?? true;
    if (bundleDependencies) {
      externalDependencies.forEach(externalDependency => {
        const packageVersion = findPackageVersion(packageManager, externalDependency);
        if (packageVersion) { dependencies[externalDependency] = packageVersion; }
      });
    } else {
      if (existsSync(join(workspaceRoot, 'package.json'))) {
        const packageJson = JSON.parse(readFileSync(join(workspaceRoot, 'package.json')).toString());
        Object.keys(packageJson.dependencies).forEach((dependency: string) => {
          dependencies[dependency] = packageJson.dependencies[dependency];
        });
      } // TODO should we throw?
    }
  }
  // TODO should we throw?
  return defaultPackage(dependencies, devDependencies, options, main);
};

export const deployToFunction = async (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string,
  staticBuildTarget: BuildTarget,
  serverBuildTarget: BuildTarget,
  options: DeployBuilderOptions,
  firebaseToken?: string,
  fsHost: FSHost = defaultFsHost
) => {

  const staticBuildOptions = await context.getTargetOptions(targetFromTargetString(staticBuildTarget.name));
  if (!staticBuildOptions.outputPath || typeof staticBuildOptions.outputPath !== 'string') {
    throw new Error(
      `Cannot read the output path option of the Angular project '${staticBuildTarget.name}' in angular.json`
    );
  }

  const serverBuildOptions = await context.getTargetOptions(targetFromTargetString(serverBuildTarget.name));
  if (!serverBuildOptions.outputPath || typeof serverBuildOptions.outputPath !== 'string') {
    throw new Error(
      `Cannot read the output path option of the Angular project '${serverBuildTarget.name}' in angular.json`
    );
  }

  const staticOut = join(workspaceRoot, staticBuildOptions.outputPath);
  const serverOut = join(workspaceRoot, serverBuildOptions.outputPath);

  const functionsOut = options.outputPath ? join(workspaceRoot, options.outputPath) : dirname(serverOut);
  const functionName = options.functionName || DEFAULT_FUNCTION_NAME;

  const newStaticOut = join(functionsOut, staticBuildOptions.outputPath);
  const newServerOut = join(functionsOut, serverBuildOptions.outputPath);

  // New behavior vs. old
  if (options.outputPath) {
    fsHost.removeSync(functionsOut);
    fsHost.copySync(staticOut, newStaticOut);
    fsHost.copySync(serverOut, newServerOut);
  } else {
    fsHost.moveSync(staticOut, newStaticOut);
    fsHost.moveSync(serverOut, newServerOut);
  }

  const packageJson = getPackageJson(context, workspaceRoot, options);
  const nodeVersion = packageJson.engines.node;

  if (!satisfies(process.versions.node, nodeVersion.toString())) {
    context.logger.warn(
      `⚠️ Your Node.js version (${process.versions.node}) does not match the Firebase Functions runtime (${nodeVersion}).`
    );
  }

  const functionsPackageJsonPath = join(functionsOut, 'package.json');
  fsHost.writeFileSync(
    functionsPackageJsonPath,
    JSON.stringify(packageJson, null, 2)
  );

  if (options.CF3v2) {
    fsHost.writeFileSync(
      join(functionsOut, 'index.js'),
      functionGen2(serverBuildOptions.outputPath, options, functionName)
    );
  } else {
    fsHost.writeFileSync(
      join(functionsOut, 'index.js'),
      defaultFunction(serverBuildOptions.outputPath, options, functionName)
    );
  }

  if (!options.prerender) {
    try {
      fsHost.renameSync(
        join(newStaticOut, 'index.html'),
        join(newStaticOut, 'index.original.html')
      );
    } catch (_) { /* empty */ }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const siteTarget = options.target ?? context.target!.project;

  if (fsHost.existsSync(functionsPackageJsonPath)) {
    // Pass the output directory as an argv entry rather than interpolating it
    // into a shell string; `functionsOut` derives from the `outputPath` deploy
    // option (angular.json) and must not be able to inject shell commands. npm is
    // a `.cmd` shim on Windows, which child_process.execFile cannot launch, so
    // this goes through the shell-free cross-spawn runner instead.
    processHost.runPackageBin('npm', ['--prefix', functionsOut, 'install'], { stdio: 'inherit' });
  } else {
    console.error(`No package.json exists at ${functionsOut}`);
  }

  if (options.preview) {

    await firebaseTools.serve({
      port: DEFAULT_EMULATOR_PORT,
      host: DEFAULT_EMULATOR_HOST,
      targets: [`hosting:${siteTarget}`, `functions:${functionName}`],
      nonInteractive: true,
      projectRoot: workspaceRoot,
    });

    const { deployProject } = await inquirer.prompt({
      type: 'confirm',
      name: 'deployProject',
      message: 'Would you like to deploy your application to Firebase Hosting & Cloud Functions?'
    }) as { deployProject: boolean };

    if (!deployProject) { return; }
  }

  return await firebaseTools.deploy({
    only: `hosting:${siteTarget},functions:${functionName}`,
    cwd: workspaceRoot,
    token: firebaseToken,
    nonInteractive: true,
    projectRoot: workspaceRoot,
  });

};


// Exported (rather than kept private) so the argv shape can be asserted directly in tests,
// without having to mock child_process.spawn.
export const buildCloudRunBuildsSubmitArgs = (
  cloudRunOut: string,
  serviceId: string,
  options: DeployBuilderOptions
): string[] => [
  'builds', 'submit', cloudRunOut,
  '--tag', `gcr.io/${options.firebaseProject}/${serviceId}`,
  '--project', options.firebaseProject,
  '--quiet',
];

export const buildCloudRunDeployArgs = (
  serviceId: string,
  options: DeployBuilderOptions,
  deployArguments: string[]
): string[] => [
  'run', 'deploy', serviceId,
  '--image', `gcr.io/${options.firebaseProject}/${serviceId}`,
  '--project', options.firebaseProject,
  ...deployArguments,
  '--platform', 'managed',
  '--allow-unauthenticated',
  '--region', options.region,
  '--quiet',
];

export const deployToCloudRun = async (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string,
  staticBuildTarget: BuildTarget,
  serverBuildTarget: BuildTarget,
  options: DeployBuilderOptions,
  firebaseToken?: string,
  fsHost: FSHost = defaultFsHost
) => {

  const staticBuildOptions = await context.getTargetOptions(targetFromTargetString(staticBuildTarget.name));
  if (!staticBuildOptions.outputPath || typeof staticBuildOptions.outputPath !== 'string') {
    throw new Error(
      `Cannot read the output path option of the Angular project '${staticBuildTarget.name}' in angular.json`
    );
  }

  const serverBuildOptions = await context.getTargetOptions(targetFromTargetString(serverBuildTarget.name));
  if (!serverBuildOptions.outputPath || typeof serverBuildOptions.outputPath !== 'string') {
    throw new Error(
      `Cannot read the output path option of the Angular project '${serverBuildTarget.name}' in angular.json`
    );
  }

  const staticOut = join(workspaceRoot, staticBuildOptions.outputPath);
  const serverOut = join(workspaceRoot, serverBuildOptions.outputPath);

  const cloudRunOut = options.outputPath ? join(workspaceRoot, options.outputPath) : join(dirname(serverOut), 'run');
  const serviceId = options.functionName || DEFAULT_FUNCTION_NAME;

  const newStaticOut = join(cloudRunOut, staticBuildOptions.outputPath);
  const newServerOut = join(cloudRunOut, serverBuildOptions.outputPath);

  // This is needed because in the server output there's a hardcoded dependency on $cwd/dist/browser,
  // This assumes that we've deployed our application dist directory and we're running the server
  // in the parent directory. To have this precondition, we move dist/browser to dist/dist/browser
  // since the firebase function runs the server from dist.
  fsHost.removeSync(cloudRunOut);
  fsHost.copySync(staticOut, newStaticOut);
  fsHost.copySync(serverOut, newServerOut);

  const packageJson = getPackageJson(context, workspaceRoot, options, join(serverBuildOptions.outputPath, 'main.js'));
  const nodeVersion = packageJson.engines.node;

  if (!satisfies(process.versions.node, nodeVersion.toString())) {
    context.logger.warn(
      `⚠️ Your Node.js version (${process.versions.node}) does not match the Cloud Run runtime (${nodeVersion}).`
    );
  }

  fsHost.writeFileSync(
    join(cloudRunOut, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );

  fsHost.writeFileSync(
    join(cloudRunOut, 'Dockerfile'),
    dockerfile(options)
  );

  if (!options.prerender) {
    try {
      fsHost.renameSync(
        join(newStaticOut, 'index.html'),
        join(newStaticOut, 'index.original.html')
      );
    } catch (_) { /* empty */ }
  }

  if (options.preview) {
    throw new SchematicsException('Cloud Run preview not supported.');
  }

  const deployArguments: string[] = [];
  const cloudRunOptions = options.cloudRunOptions || {};
  Object.entries(DEFAULT_CLOUD_RUN_OPTIONS).forEach(([k, v]) => {
    cloudRunOptions[k] ||= v;
  });
  // lean on the schema for validation (rather than sanitize)
  if (cloudRunOptions.cpus) { deployArguments.push('--cpu', cloudRunOptions.cpus.toString()); }
  if (cloudRunOptions.maxConcurrency) { deployArguments.push('--concurrency', cloudRunOptions.maxConcurrency.toString()); }
  if (cloudRunOptions.maxInstances) { deployArguments.push('--max-instances', cloudRunOptions.maxInstances.toString()); }
  if (cloudRunOptions.memory) { deployArguments.push('--memory', cloudRunOptions.memory.toString()); }
  if (cloudRunOptions.minInstances) { deployArguments.push('--min-instances', cloudRunOptions.minInstances.toString()); }
  if (cloudRunOptions.timeout) { deployArguments.push('--timeout', cloudRunOptions.timeout.toString()); }
  if (cloudRunOptions.vpcConnector) { deployArguments.push('--vpc-connector', cloudRunOptions.vpcConnector); }

  context.logger.info(`📦 Deploying to Cloud Run`);
  await spawnAsync('gcloud', buildCloudRunBuildsSubmitArgs(cloudRunOut, serviceId, options));
  await spawnAsync('gcloud', buildCloudRunDeployArgs(serviceId, options, deployArguments));

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const siteTarget = options.target ?? context.target!.project;

  // TODO deploy cloud run
  return await firebaseTools.deploy({
    only: `hosting:${siteTarget}`,
    cwd: workspaceRoot,
    token: firebaseToken,
    nonInteractive: true,
    projectRoot: workspaceRoot,
  });
};

export default async function deploy(
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  staticBuildTarget: BuildTarget,
  serverBuildTarget: BuildTarget | undefined,
  prerenderBuildTarget: BuildTarget | undefined,
  firebaseProject: string,
  options: DeployBuilderOptions,
  firebaseToken?: string,
) {
  const legacyNgDeploy = !options.version || options.version < 2;

  if (!firebaseToken && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    await firebaseTools.login();
    const user = await firebaseTools.login({ projectRoot: context.workspaceRoot });
    console.log(`Logged into Firebase as ${user.email}.`);
  }

  if (!firebaseToken && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    await spawnAsync('gcloud', ['auth', 'activate-service-account', '--key-file', process.env.GOOGLE_APPLICATION_CREDENTIALS as string]);
    console.log(`Using Google Application Credentials.`);
  }

  if (legacyNgDeploy) {
    console.error(`Legacy ng-deploy Firebase is deprecated.
Please migrate to Firebase Hosting's integration with Angular https://firebase.google.com/docs/hosting/frameworks/angular
or the new Firebase App Hosting product https://firebase.google.com/docs/app-hosting`);
  }

  if (prerenderBuildTarget) {
    const run = await context.scheduleTarget(
      targetFromTargetString(prerenderBuildTarget.name),
      prerenderBuildTarget.options
    );
    await run.result;

  } else {

    if (!context.target) {
      throw new Error('Cannot execute the build target');
    }

    context.logger.info(`📦 Building "${context.target.project}"`);

    const builders = [
      context.scheduleTarget(
        targetFromTargetString(staticBuildTarget.name),
        staticBuildTarget.options
      ).then(run => run.result)
    ];

    if (serverBuildTarget) {
      builders.push(context.scheduleTarget(
        targetFromTargetString(serverBuildTarget.name),
        serverBuildTarget.options
      ).then(run => run.result));
    }

    await Promise.all(builders);
  }


  try {
    await firebaseTools.use(firebaseProject, {
      project: firebaseProject,
      projectRoot: context.workspaceRoot,
    });
  } catch (_) {
    throw new Error(`Cannot select firebase project '${firebaseProject}'`);
  }

  options.firebaseProject = firebaseProject;

  const logger = new winston.transports.Console({
    level: 'info',
    format: winston.format.printf((info) => {
      const emulator = info[tripleBeam.SPLAT as any]?.[1]?.metadata?.emulator;
      const text = info[tripleBeam.SPLAT as any]?.[0];
      if (text?.replace) {
        // eslint-disable-next-line no-control-regex
        const plainText = text.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]/g, '');
        if (emulator?.name === 'hosting' && plainText.startsWith('Local server: ')) {
          open(plainText.split(': ')[1]);
        }
      }
      return [info.message, ...(info[tripleBeam.SPLAT as any] || []) as any]
        .filter((chunk) => typeof chunk === 'string')
        .join(' ');
    })
  });

  firebaseTools.logger.logger.add(logger);

  if (legacyNgDeploy && serverBuildTarget) {
    if (options.ssr === 'cloud-run') {
      await deployToCloudRun(
        firebaseTools,
        context,
        context.workspaceRoot,
        staticBuildTarget,
        serverBuildTarget,
        options,
        firebaseToken,
      );
    } else {
      await deployToFunction(
        firebaseTools,
        context,
        context.workspaceRoot,
        staticBuildTarget,
        serverBuildTarget,
        options,
        firebaseToken,
      );
    }
  } else {
    await deployToHosting(
      firebaseTools,
      context,
      context.workspaceRoot,
      options,
      firebaseToken,
    );
  }

}
