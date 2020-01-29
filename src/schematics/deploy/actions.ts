import {BuilderContext, targetFromTargetString} from '@angular-devkit/architect';
import {BuildTarget, FirebaseTools, FSHost} from '../interfaces';
import {writeFileSync, renameSync} from 'fs';
import {copySync, removeSync} from 'fs-extra';
import {join, dirname, basename} from 'path';
import {defaultFunction, defaultPackage} from './functions-templates';
import {experimental} from '@angular-devkit/core';
import {SchematicsException} from '@angular-devkit/schematics';

const moveSync = (src: string, dest: string) => {
  copySync(src, dest);
  removeSync(src);
};

const deployToHosting = (firebaseTools: FirebaseTools, context: BuilderContext, workspaceRoot: string) => {
  return firebaseTools.deploy({
    // tslint:disable-next-line:no-non-null-assertion
    only: 'hosting: ' + context.target!.project,
    cwd: workspaceRoot
  });
};

const defaultFsHost: FSHost = {
  moveSync,
  writeFileSync,
  renameSync,
};

export const deployToFunction = async (
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  workspaceRoot: string,
  project: experimental.workspace.WorkspaceTool,
  fsHost: FSHost = defaultFsHost
) => {
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

  fsHost.writeFileSync(join(dirname(serverOut), 'package.json'), defaultPackage);
  fsHost.writeFileSync(join(dirname(serverOut), 'index.js'), defaultFunction(serverOut));

  fsHost.renameSync(join(newClientPath, 'index.html'), join(newClientPath, 'index.original.html'));

  context.logger.info('Deploying your Angular Universal application...');

  return firebaseTools.deploy({
    cwd: workspaceRoot
  });
};

export default async function deploy(
  firebaseTools: FirebaseTools,
  context: BuilderContext,
  projectTargets: experimental.workspace.WorkspaceTool,
  buildTargets: BuildTarget[],
  firebaseProject: string,
  ssr: boolean,
) {

  await firebaseTools.login();

  if (!context.target) {
    throw new Error('Cannot execute the build target');
  }

  context.logger.info(`📦 Building "${context.target.project}"`);

  for (const target of buildTargets) {
    const run = await context.scheduleTarget(targetFromTargetString(target.name), target.options);
    await run.result;
  }

  try {
    await firebaseTools.use(firebaseProject, {project: firebaseProject});
  } catch (e) {
    throw new Error(`Cannot select firebase project '${firebaseProject}'`);
  }

  try {
    let success: { hosting: string };

    if (ssr) {
      success = await deployToFunction(firebaseTools, context, context.workspaceRoot, projectTargets);
    } else {
      success = await deployToHosting(firebaseTools, context, context.workspaceRoot);
    }

    context.logger.info(
      `🚀 Your application is now available at https://${
        success.hosting.split('/')[1]
      }.firebaseapp.com/`
    );
  } catch (e) {
    context.logger.error(e.message || e);
  }
}
