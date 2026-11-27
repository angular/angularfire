/**
 * @fileoverview The Firebase App Hosting part of `ng add`: checking that the installed Firebase
 * CLI can set App Hosting up, saying what App Hosting requires of the Firebase project, and
 * choosing or creating the backend that `ng deploy` will deploy to.
 *
 * A backend is what App Hosting deploys an app to. An Angular app built with server-side
 * rendering includes a Node.js server program that renders pages. App Hosting builds the app
 * from its source in Google Cloud and runs that program there, on Cloud Run, in the region the
 * backend was created in.
 */

import { SchematicContext, SchematicsException } from '@angular-devkit/schematics';
import { appHostingMinVersion, supportsAppHosting } from '../firebaseTools.js';
import { FirebaseTools, FirebaseToolsCommandOptions } from '../interfaces.js';
import { alreadyDeploysLocalFiles, backendIdFromProjectName } from './deployConfigs.js';
import { appHostingBackendPrompt } from './deployPrompts.js';
import { confirmPrompt } from './prompts.js';

/** What a Firebase project needs before App Hosting works in it, as a sentence to show the user. */
export const appHostingRequirements = (projectId: string): string =>
  'Firebase App Hosting needs the Blaze pricing plan ' +
  `(https://console.firebase.google.com/project/${projectId}/usage/details), ` +
  'its Terms of Service accepted in the Firebase console, and, for the first deploy to a region, ' +
  'an account with the Owner or IAM Admin role on the project.';

/** Stops `ng add` when the installed firebase-tools cannot set up App Hosting. */
export const assertAppHostingSetupSupported = (firebaseTools: FirebaseTools): void => {
  if (!supportsAppHosting(firebaseTools)) {
    throw new SchematicsException(
      `Setting up App Hosting needs firebase-tools ${appHostingMinVersion} or newer with its ` +
      `App Hosting commands enabled, and this is ${firebaseTools.cli.version()}. ` +
      'Nothing was set up, the selected features included. Upgrade firebase-tools, then run ' +
      'ng add @angular/fire again. To set up the features without upgrading, run it again and ' +
      'choose Firebase Hosting or "Don\'t set up deployment".'
    );
  }
};

/** What `selectAppHostingBackend` needs to know about the `ng add` run it is part of. */
export interface AppHostingSetupRequest {
  /** The Firebase project the backend belongs to. */
  projectId: string;
  /** The workspace root on disk. */
  projectRoot: string;
  /** The email of the signed-in Firebase account to act as. */
  account: string;
  /** The Firebase web app a new backend is linked to. */
  webAppId: string;
  /** Used to suggest an id for a new backend. */
  angularProjectName: string;
  /** The backend the app already deploys to, if any. The cursor starts on it in the list of backends. */
  existingBackendId: string | undefined;
}

/** The backend `ng deploy` will deploy to, as chosen during `ng add`. */
export interface AppHostingSetup {
  backendId: string;
  /**
   * True when the backend is connected to a GitHub repository and the user agreed that
   * `ng deploy` uploads local files to it anyway. Written to firebase.json, which is where the
   * Firebase CLI looks for that answer.
   */
  alwaysDeployFromSource: boolean;
}

/**
 * Asks which App Hosting backend `ng deploy` should deploy to, and creates it when the user
 * asks for a new one.
 *
 * A backend can be connected to a GitHub repository, and App Hosting then deploys it from each
 * commit pushed there. Uploading local files to such a backend replaces what GitHub last
 * deployed, so the user is asked to confirm. Returns undefined when they decline, meaning no
 * backend was chosen.
 */
export const selectAppHostingBackend = async (
  firebaseTools: FirebaseTools,
  context: SchematicContext,
  request: AppHostingSetupRequest,
): Promise<AppHostingSetup | undefined> => {
  const { projectId, projectRoot, account, webAppId, angularProjectName, existingBackendId } = request;

  /* A function instead of one shared object. Each Firebase CLI call needs a new options object.
   * `nonInteractive` keeps the CLI from asking its own questions. */
  const newCallOptions = (): FirebaseToolsCommandOptions => (
    { project: projectId, projectRoot, account, nonInteractive: true }
  );

  /* Billing, Terms of Service and permissions are the usual reasons these calls fail, and the
   * Firebase CLI's own error does not always say so. Every failure repeats the requirements. */
  const failure = (action: string, error: Error) => new SchematicsException(
    `Could not ${action} for project ${projectId}: ${error.message}\n${appHostingRequirements(projectId)}`
  );

  // `assertAppHostingSetupSupported` has already checked that these commands exist.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { backends: backendCommands } = firebaseTools.apphosting!;

  const backends = await backendCommands.list(newCallOptions()).catch((error: Error) => {
    throw failure('list App Hosting backends', error);
  });

  const suggestedBackendId = backendIdFromProjectName(angularProjectName);
  const choice = await appHostingBackendPrompt(backends, suggestedBackendId, existingBackendId);

  // A region is set only when the user asked for a new backend.
  if (choice.newBackendRegion) {
    context.logger.info(`Creating App Hosting backend ${choice.backendId} in ${choice.newBackendRegion}...`);
    await backendCommands.create({
      ...newCallOptions(),
      backend: choice.backendId,
      primaryRegion: choice.newBackendRegion,
      rootDir: '.',
      app: webAppId,
    }).catch((error: Error) => {
      throw failure(`create the App Hosting backend ${choice.backendId}`, error);
    });
    return { backendId: choice.backendId, alwaysDeployFromSource: false };
  }

  if (choice.linkedToGitHub) {
    // The user agreed to this for the same backend in an earlier run, so it is not asked again.
    if (alreadyDeploysLocalFiles(projectRoot, choice.backendId)) {
      return { backendId: choice.backendId, alwaysDeployFromSource: true };
    }

    const deployLocalFiles = await confirmPrompt(
      `${choice.backendId} deploys from a GitHub repository today. ng deploy uploads your local ` +
      'files instead, which replaces what GitHub last rolled out. Deploy local files to it?',
    );
    return deployLocalFiles ? { backendId: choice.backendId, alwaysDeployFromSource: true } : undefined;
  }

  return { backendId: choice.backendId, alwaysDeployFromSource: false };
};
