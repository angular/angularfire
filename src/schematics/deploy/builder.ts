import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import deploy, { DeployBuilderOptions } from './actions';
import { BuildTarget } from '../interfaces';
import { getFirebaseProjectNameFromFs } from '../utils';
import { getFirebaseTools } from '../firebaseTools';

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder(
  async (options: DeployBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    const [defaultFirebaseProject, defulatFirebaseHostingSite] = getFirebaseProjectNameFromFs(
      context.workspaceRoot,
      context.target.project
    );

    const firebaseProject = options.firebaseProject || defaultFirebaseProject;
    if (!firebaseProject) {
      throw new Error('Cannot determine the Firebase Project from your angular.json or .firebaserc');
    }
    if (firebaseProject !== defaultFirebaseProject) {
      throw new Error('The Firebase Project specified by your angular.json or .firebaserc is in conflict');
    }

    const firebaseHostingSite = options.firebaseHostingSite || defulatFirebaseHostingSite;
    if (!firebaseHostingSite) {
      throw new Error(`Cannot determine the Firebase Hosting Site from your angular.json or .firebaserc`);
    }
    if (firebaseHostingSite !== defulatFirebaseHostingSite) {
      throw new Error('The Firebase Hosting Site specified by your angular.json or .firebaserc is in conflict');
    }

    const staticBuildTarget = { name: options.browserTarget || options.buildTarget || `${context.target.project}:build:production` };

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
        (await getFirebaseTools()),
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
