import { SpawnOptionsWithoutStdio, execSync, spawn } from 'child_process';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { BuilderContext, targetFromTargetString } from '@angular-devkit/architect';
import { SchematicsException } from '@angular-devkit/schematics';
import { copySync, removeSync } from 'fs-extra';
import * as inquirer from 'inquirer';
import open from 'open';
import { satisfies } from 'semver';
import tripleBeam from 'triple-beam';
import * as winston from 'winston';
import { BuildTarget, CloudRunOptions, DeployBuilderSchema, FSHost, FirebaseTools } from '../interfaces';
import { firebaseFunctionsDependencies } from '../versions.json';
import { DEFAULT_FUNCTION_NAME, defaultFunction, defaultPackage, dockerfile, functionGen2 } from './functions-templates';

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
  options?: SpawnOptionsWithoutStdio
) =>
  new Promise<Buffer>((resolve, reject) => {
    const [spawnCommand, ...args] = command.split(/\s+/);
    const spawnProcess = spawn(spawnCommand, args, options);
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
      if (code === 1) {
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

const findPackageVersion = (packageManager: string, name: string) => {
  const match = execSync(`${packageManager} list ${name}`).toString().match(`[^|s]${escapeRegExp(name)}[@| ][^s]+(s.+)?$`);
  return match ? match[0].split(new RegExp(`${escapeRegExp(name)}[@| ]`))[1].split(/\s/)[0] : null;
};

const getPackageJson = (context: BuilderContext, workspaceRoot: string, options: DeployBuilderOptions, main?: string) => {
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
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
    } catch (e) { /* empty */ }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const siteTarget = options.target ?? context.target!.project;

  if (fsHost.existsSync(functionsPackageJsonPath)) {
    execSync(`npm --prefix ${functionsOut} install`);
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
    } catch (e) { /* empty */ }
  }

  if (options.preview) {
    throw new SchematicsException('Cloud Run preview not supported.');
  }

  const deployArguments: any[] = [];
  const cloudRunOptions = options.cloudRunOptions || {};
  Object.entries(DEFAULT_CLOUD_RUN_OPTIONS).forEach(([k, v]) => {
    cloudRunOptions[k] ||= v;
  });
  // lean on the schema for validation (rather than sanitize)
  if (cloudRunOptions.cpus) { deployArguments.push('--cpu', cloudRunOptions.cpus); }
  if (cloudRunOptions.maxConcurrency) { deployArguments.push('--concurrency', cloudRunOptions.maxConcurrency); }
  if (cloudRunOptions.maxInstances) { deployArguments.push('--max-instances', cloudRunOptions.maxInstances); }
  if (cloudRunOptions.memory) { deployArguments.push('--memory', cloudRunOptions.memory); }
  if (cloudRunOptions.minInstances) { deployArguments.push('--min-instances', cloudRunOptions.minInstances); }
  if (cloudRunOptions.timeout) { deployArguments.push('--timeout', cloudRunOptions.timeout); }
  if (cloudRunOptions.vpcConnector) { deployArguments.push('--vpc-connector', cloudRunOptions.vpcConnector); }

  // TODO validate serviceId, firebaseProject, and vpcConnector both to limit errors and opp for injection

  context.logger.info(`📦 Deploying to Cloud Run`);
  await spawnAsync(`gcloud builds submit ${cloudRunOut} --tag gcr.io/${options.firebaseProject}/${serviceId} --project ${options.firebaseProject} --quiet`);
  await spawnAsync(`gcloud run deploy ${serviceId} --image gcr.io/${options.firebaseProject}/${serviceId} --project ${options.firebaseProject} ${deployArguments.join(' ')} --platform managed --allow-unauthenticated --region=${options.region} --quiet`);

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
    await spawnAsync(`gcloud auth activate-service-account --key-file ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
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
  } catch (e) {
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
      return [info.message, ...(info[tripleBeam.SPLAT as any] || [])]
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
