import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import deploy from './actions';
import { experimental, json, normalize } from '@angular-devkit/core';
import { BuildTarget, DeployBuilderSchema } from '../interfaces';
import { getFirebaseProjectName } from '../utils';

type DeployBuilderOptions = DeployBuilderSchema & json.JsonObject;

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder<any>(
  async (options: DeployBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
    // The project root is added to a BuilderContext.
    const root = normalize(context.workspaceRoot);
    const workspace = new experimental.workspace.Workspace(
      root,
      new NodeJsSyncHost()
    );
    await workspace
      .loadWorkspaceFromHost(normalize('angular.json'))
      .toPromise();

    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    const projectTargets = workspace.getProjectTargets(context.target.project);

    const firebaseProject = getFirebaseProjectName(
      context.workspaceRoot,
      context.target.project
    );

    if (!firebaseProject) {
      throw new Error('Cannot find firebase project for your app in .firebaserc');
    }

    const buildTarget = options.buildTarget || `${context.target.project}:build:production`;

    const targets: BuildTarget[] = [{
      name: buildTarget
    }];
    if (options.ssr) {
      targets.push({
        name: options.universalBuildTarget || `${context.target.project}:server:production`,
        options: {
          bundleDependencies: 'all'
        }
      });
    }

    try {
      await deploy(
        require('firebase-tools'),
        context,
        projectTargets,
        targets,
        firebaseProject,
        !!options.ssr,
        !!options.preview
      );
    } catch (e) {
      console.error('Error when trying to deploy: ');
      console.error(e.message);
      return { success: false };
    }

    return { success: true };
  }
);
