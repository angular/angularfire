import { BuilderContext, BuilderOutput, createBuilder } from '@angular-devkit/architect';
import { getFirebaseTools } from '../firebaseTools';
import { hostingSiteFromRc, readFirebaseRc } from '../firebaserc';
import { BuildTarget } from '../interfaces';
import deploy, { DeployBuilderOptions } from './actions';
import { chooseFirebaseProject } from './firebaseProject';

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder(
  async (options: DeployBuilderOptions, context: BuilderContext): Promise<BuilderOutput> => {
    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    const angularProjectName = context.target.project;
    const firebaseRc = readFirebaseRc(context.workspaceRoot);

    const firebaseProject = await chooseFirebaseProject(context, firebaseRc, angularProjectName, options);
    // Undefined means no project could be chosen, and the reason has been printed.
    if (!firebaseProject) { return { success: false }; }

    /* A Hosting site is needed only when deploying to Firebase Hosting. A deploy to Firebase
     * App Hosting goes to the App Hosting backend that the `appHostingBackend` option specifies. */
    if (!options.appHostingBackend) {
      const defaultFirebaseHostingSite = hostingSiteFromRc(firebaseRc, firebaseProject, angularProjectName);
      const firebaseHostingSite = options.firebaseHostingSite || defaultFirebaseHostingSite;
      if (!firebaseHostingSite) {
        throw new Error(`Cannot determine the Firebase Hosting Site from your angular.json or .firebaserc`);
      }
      if (firebaseHostingSite !== defaultFirebaseHostingSite) {
        throw new Error('The Firebase Hosting Site specified by your angular.json or .firebaserc is in conflict');
      }
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
