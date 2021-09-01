import { BuilderContext, targetFromTargetString } from '@angular-devkit/architect';
import { BuildTarget, DeployBuilderSchema, FirebaseTools, FSHost } from '../interfaces';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { copySync, removeSync } from 'fs-extra';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { defaultFunction, defaultPackage } from './functions-templates';
import { satisfies } from 'semver';
import * as open from 'open';

export type DeployBuilderOptions = DeployBuilderSchema | Record<string, string>;

const escapeRegExp = (str: string) => str.replace(/[\-\[\]\/{}()*+?.\\^$|]/g, '\\$&');

const moveSync = (src: string, dest: string) => {
  copySync(src, dest);
  removeSync(src);
};

const deployToHosting = (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string,
  options: DeployBuilderOptions,
  firebaseToken?: string,
) => {

  if (options.preview) {
    const port = 5000; // TODO make this configurable

    setTimeout(() => {
      open(`http://localhost:${port}`);
    }, 1500);

    return firebaseTools.serve({ port, targets: ['hosting'], host: 'localhost' }).then(() =>
      require('inquirer').prompt({
        type: 'confirm',
        name: 'deployProject',
        message: 'Would you like to deploy your application to Firebase Hosting?'
      })
    ).then(({ deployProject }: { deployProject: boolean }) => {
      if (deployProject) {
        return firebaseTools.deploy({
          // tslint:disable-next-line:no-non-null-assertion
          only: 'hosting:' + context.target!.project,
          cwd: workspaceRoot,
          token: firebaseToken,
        });
      } else {
        return Promise.resolve();
      }
    });

  } else {

    return firebaseTools.deploy({
      // tslint:disable-next-line:no-non-null-assertion
      only: 'hosting:' + context.target!.project,
      cwd: workspaceRoot,
      token: firebaseToken,
    });

  }
};

const defaultFsHost: FSHost = {
  moveSync,
  writeFileSync,
  renameSync
};

const getVersionRange = (v: number) => `^${v}.0.0`;

const findPackageVersion = (name: string) => {
  const match = execSync(`npm list ${name}`).toString().match(` ${escapeRegExp(name)}@.+\\w`);
  return match ? match[0].split(`${name}@`)[1].split(/\s/)[0] : null;
};

const getPackageJson = (context: BuilderContext, workspaceRoot: string, options: DeployBuilderOptions) => {
  const dependencies = {
    'firebase-admin': 'latest',
    'firebase-functions': 'latest'
  };
  const devDependencies = {
    'firebase-functions-test': 'latest'
  };
  Object.keys(dependencies).forEach((dependency: string) => {
    const packageVersion = findPackageVersion(dependency);
    if (packageVersion) { dependencies[dependency] = packageVersion; }
  });
  Object.keys(devDependencies).forEach((devDependency: string) => {
    const packageVersion = findPackageVersion(devDependency);
    if (packageVersion) { devDependencies[devDependency] = packageVersion; }
  });
  if (existsSync(join(workspaceRoot, 'angular.json'))) {
    const angularJson = JSON.parse(readFileSync(join(workspaceRoot, 'angular.json')).toString());
    // tslint:disable-next-line:no-non-null-assertion
    const server = angularJson.projects[context.target!.project].architect.server;
    const serverOptions = server && server.options;
    const externalDependencies = serverOptions && serverOptions.externalDependencies || [];
    const bundleDependencies = serverOptions && serverOptions.bundleDependencies;
    if (bundleDependencies !== true) {
      if (existsSync(join(workspaceRoot, 'package.json'))) {
        const packageJson = JSON.parse(readFileSync(join(workspaceRoot, 'package.json')).toString());
        Object.keys(packageJson.dependencies).forEach((dependency: string) => {
          dependencies[dependency] = packageJson.dependencies[dependency];
        });
      } // TODO should we throw?
    } else {
      externalDependencies.forEach(externalDependency => {
        const packageVersion = findPackageVersion(externalDependency);
        if (packageVersion) { dependencies[externalDependency] = packageVersion; }
      });
    }
  } // TODO should we throw?
  return defaultPackage(dependencies, devDependencies, options);
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

  const staticOut = staticBuildOptions.outputPath;
  const serverOut = serverBuildOptions.outputPath;
  const newClientPath = join(dirname(staticOut), staticOut);
  const newServerPath = join(dirname(serverOut), serverOut);

  // This is needed because in the server output there's a hardcoded dependency on $cwd/dist/browser,
  // This assumes that we've deployed our application dist directory and we're running the server
  // in the parent directory. To have this precondition, we move dist/browser to dist/dist/browser
  // since the firebase function runs the server from dist.
  fsHost.moveSync(staticOut, newClientPath);
  fsHost.moveSync(serverOut, newServerPath);

  const packageJson = getPackageJson(context, workspaceRoot, options);
  const nodeVersion = JSON.parse(packageJson).engines.node;

  if (!satisfies(process.versions.node, getVersionRange(nodeVersion))) {
    context.logger.warn(
      `⚠️ Your Node.js version (${process.versions.node}) does not match the Firebase Functions runtime (${nodeVersion}).`
    );
  }

  fsHost.writeFileSync(
    join(dirname(serverOut), 'package.json'),
    packageJson
  );

  fsHost.writeFileSync(
    join(dirname(serverOut), 'index.js'),
    defaultFunction(serverOut, options)
  );

  fsHost.renameSync(
    join(newClientPath, 'index.html'),
    join(newClientPath, 'index.original.html')
  );

  if (options.preview) {
    const port = 5000; // TODO make this configurable

    setTimeout(() => {
      open(`http://localhost:${port}`);
    }, 1500);

    return firebaseTools.serve({ port, targets: ['hosting', 'functions'], host: 'localhost'}).then(() =>
      require('inquirer').prompt({
        type: 'confirm',
        name: 'deployProject',
        message: 'Would you like to deploy your application to Firebase Hosting & Cloud Functions?'
      })
    ).then(({ deployProject }: { deployProject: boolean }) => {
      if (deployProject) {
        return firebaseTools.deploy({
          // tslint:disable-next-line:no-non-null-assertion
          only: `hosting:${context.target!.project},functions:ssr`,
          cwd: workspaceRoot
        });
      } else {
        return Promise.resolve();
      }
    });
  } else {
    return firebaseTools.deploy({
      // tslint:disable-next-line:no-non-null-assertion
      only: `hosting:${context.target!.project},functions:ssr`,
      cwd: workspaceRoot,
      token: firebaseToken,
    });
  }
};

export default async function deploy(
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  staticBuildTarget: BuildTarget,
  serverBuildTarget: BuildTarget | undefined,
  firebaseProject: string,
  options: DeployBuilderOptions,
  firebaseToken?: string,
) {
  if (!firebaseToken) {
    await firebaseTools.login();
  }

  if (!context.target) {
    throw new Error('Cannot execute the build target');
  }

  context.logger.info(`📦 Building "${context.target.project}"`);

  const run = await context.scheduleTarget(
    targetFromTargetString(staticBuildTarget.name),
    staticBuildTarget.options
  );
  await run.result;

  if (serverBuildTarget) {
    const run = await context.scheduleTarget(
      targetFromTargetString(serverBuildTarget.name),
      serverBuildTarget.options
    );
    await run.result;
  }

  try {
    await firebaseTools.use(firebaseProject, { project: firebaseProject });
  } catch (e) {
    throw new Error(`Cannot select firebase project '${firebaseProject}'`);
  }

  try {
    const winston = require('winston');
    const tripleBeam = require('triple-beam');

    const logger = new winston.transports.Console({
      level: 'info',
      format: winston.format.printf((info) =>
        [info.message, ...(info[tripleBeam.SPLAT] || [])]
          .filter((chunk) => typeof chunk === 'string')
          .join(' ')
      )
    });

    firebaseTools.logger.logger.add(logger);

    if (serverBuildTarget) {
      await deployToFunction(
        firebaseTools,
        context,
        context.workspaceRoot,
        staticBuildTarget,
        serverBuildTarget,
        options,
        firebaseToken,
      );
    } else {
      await deployToHosting(
        firebaseTools,
        context,
        context.workspaceRoot,
        options,
        firebaseToken,
      );
    }

  } catch (e) {
    context.logger.error(e.message || e);
  }
}
