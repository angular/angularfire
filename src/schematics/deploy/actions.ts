import { BuilderContext, targetFromTargetString } from '@angular-devkit/architect';
import { BuildTarget, FirebaseTools, FSHost } from '../interfaces';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { copySync, removeSync } from 'fs-extra';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { defaultFunction, defaultPackage, NODE_VERSION } from './functions-templates';
import { experimental } from '@angular-devkit/core';
import { SchematicsException } from '@angular-devkit/schematics';
import { satisfies } from 'semver';
import * as open from 'open';

const escapeRegExp = (str: string) => str.replace(/[\-\[\]\/{}()*+?.\\^$|]/g, '\\$&');

const moveSync = (src: string, dest: string) => {
  copySync(src, dest);
  removeSync(src);
};

const deployToHosting = (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string,
  preview: boolean
) => {

  if (preview) {
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
          cwd: workspaceRoot
        });
      } else {
        return Promise.resolve();
      }
    });

  } else {

    return firebaseTools.deploy({
      // tslint:disable-next-line:no-non-null-assertion
      only: 'hosting:' + context.target!.project,
      cwd: workspaceRoot
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
  return match ? match[0].split(`${name}@`)[1] : null;
};

const getPackageJson = (context: BuilderContext, workspaceRoot: string) => {
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
  return defaultPackage(dependencies, devDependencies);
};

export const deployToFunction = async (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string,
  project: experimental.workspace.WorkspaceTool,
  preview: boolean,
  fsHost: FSHost = defaultFsHost
) => {
  if (!satisfies(process.versions.node, getVersionRange(NODE_VERSION))) {
    context.logger.warn(
      `⚠️ Your Node.js version (${process.versions.node}) does not match the Firebase Functions runtime (${NODE_VERSION}).`
    );
  }

  if (
    !project ||
    !project.build ||
    !project.build.options ||
    !project.build.options.outputPath
  ) {
    throw new SchematicsException(
      `Cannot read the output path (architect.build.options.outputPath) of the Angular project in angular.json`
    );
  }

  if (
    !project ||
    !project.server ||
    !project.server.options ||
    !project.server.options.outputPath
  ) {
    throw new SchematicsException(
      `Cannot read the output path (architect.server.options.outputPath) of the Angular project in angular.json`
    );
  }

  const staticOut = project.build.options.outputPath;
  const serverOut = project.server.options.outputPath;
  const newClientPath = join(dirname(staticOut), staticOut);
  const newServerPath = join(dirname(serverOut), serverOut);

  // This is needed because in the server output there's a hardcoded dependency on $cwd/dist/browser,
  // This assumes that we've deployed our application dist directory and we're running the server
  // in the parent directory. To have this precondition, we move dist/browser to dist/dist/browser
  // since the firebase function runs the server from dist.
  fsHost.moveSync(staticOut, newClientPath);
  fsHost.moveSync(serverOut, newServerPath);

  fsHost.writeFileSync(
    join(dirname(serverOut), 'package.json'),
    getPackageJson(context, workspaceRoot)
  );

  fsHost.writeFileSync(
    join(dirname(serverOut), 'index.js'),
    defaultFunction(serverOut)
  );

  fsHost.renameSync(
    join(newClientPath, 'index.html'),
    join(newClientPath, 'index.original.html')
  );

  if (preview) {
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
      cwd: workspaceRoot
    });
  }
};

export default async function deploy(
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  projectTargets: experimental.workspace.WorkspaceTool,
  buildTargets: BuildTarget[],
  firebaseProject: string,
  ssr: boolean,
  preview: boolean
) {
  await firebaseTools.login();

  if (!context.target) {
    throw new Error('Cannot execute the build target');
  }

  context.logger.info(`📦 Building "${context.target.project}"`);

  for (const target of buildTargets) {
    const run = await context.scheduleTarget(
      targetFromTargetString(target.name),
      target.options
    );
    await run.result;
  }

  try {
    await firebaseTools.use(firebaseProject, { project: firebaseProject });
    context.logger.info(`🔥 Your configured Firebase project is '${firebaseProject}'`);
  } catch (e) {
    throw new Error(`Cannot select firebase project '${firebaseProject}'`);
  }

  try {
    const winston = require('winston');
    const tripleBeam = require('triple-beam');

    firebaseTools.logger.add(
      new winston.transports.Console({
        level: 'info',
        format: winston.format.printf((info) =>
          [info.message, ...(info[tripleBeam.SPLAT] || [])]
            .filter((chunk) => typeof chunk === 'string')
            .join(' ')
        )
      })
    );

    if (ssr) {
      await deployToFunction(
        firebaseTools,
        context,
        context.workspaceRoot,
        projectTargets,
        preview
      );
    } else {
      await deployToHosting(
        firebaseTools,
        context,
        context.workspaceRoot,
        preview
      );
    }

  } catch (e) {
    context.logger.error(e.message || e);
  }
}
