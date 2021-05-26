import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import deploy, { DeployBuilderOptions } from './actions';
import { BuildTarget } from '../interfaces';
import { getFirebaseProjectName } from '../utils';

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder(
  async (options: DeployBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    const firebaseProject = options.firebaseProject || getFirebaseProjectName(
      context.workspaceRoot,
      context.target.project
    );

    if (!firebaseProject) {
      throw new Error('Cannot find firebase project for your app in .firebaserc');
    }

    const staticBuildTarget = { name: options.buildTarget || `${context.target.project}:build:production` };

    let prerenderBuildTarget: BuildTarget | undefined;
    if (options.prerender) {
      prerenderBuildTarget = {
        name: options.prerenderTarget || `${context.target.project}:prerender:production`
      };
    }

    let serverBuildTarget: BuildTarget | undefined;
    if (options.ssr) {
      serverBuildTarget = {
        name: options.serverTarget || options.universalBuildTarget || `${context.target.project}:server:production`
      };
    }

    try {
      process.env.FIREBASE_DEPLOY_AGENT = 'angularfire';
      await deploy(
        require('firebase-tools'),
        context,
        staticBuildTarget,
        serverBuildTarget,
        prerenderBuildTarget,
        firebaseProject,
        options,
        process.env.FIREBASE_TOKEN,
      );
    } catch (e) {
      console.error('Error when trying to deploy: ');
      console.error(e.message);
      return { success: false };
    }

    return { success: true };
  }
);
