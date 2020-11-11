import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import deploy from './actions';
import { BuildTarget, DeployBuilderSchema } from '../interfaces';
import { getFirebaseProjectName } from '../utils';

type DeployBuilderOptions = DeployBuilderSchema & Record<string, string>;

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder(
  async (options: DeployBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    const firebaseProject = getFirebaseProjectName(
      context.workspaceRoot,
      context.target.project
    );

    if (!firebaseProject) {
      throw new Error('Cannot find firebase project for your app in .firebaserc');
    }

    const staticBuildTarget = { name: options.buildTarget || `${context.target.project}:build:production` };

    let serverBuildTarget: BuildTarget | undefined;
    if (options.ssr) {
      serverBuildTarget = {
        name: options.universalBuildTarget || `${context.target.project}:server:production`,
        options: {
          bundleDependencies: 'all'
        }
      };
    }

    try {
      await deploy(
        require('firebase-tools'),
        context,
        staticBuildTarget,
        serverBuildTarget,
        firebaseProject,
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
