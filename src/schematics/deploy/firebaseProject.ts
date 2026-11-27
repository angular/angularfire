/**
 * @fileoverview Works out which Firebase project `ng deploy` deploys to.
 *
 * Two files have a say:
 *
 * - `.firebaserc`, the Firebase CLI's file, records the workspace's default project under
 *   `projects.default`. It also records, separately for each Firebase project, which Hosting site
 *   a Hosting target name refers to in that project. AngularFire uses the Angular project's name
 *   as the target name.
 * - `angular.json` can specify the project, in the `firebaseProject` option of the Angular
 *   project's `deploy` entry. `ng deploy --firebase-project=<project id>` sets the same option.
 *
 * `.firebaserc` can have the target name under more than one Firebase project, for example a
 * staging project and a production project. Nothing in that file then says which of them a
 * deploy is meant for, so `ng deploy` only deploys to a project it was told about: the
 * `firebaseProject` option, or the user's answer to a prompt question.
 */

import { BuilderContext } from '@angular-devkit/architect';
import inquirer from 'inquirer';
import { projectsWithHostingTarget } from '../firebaserc.js';
import { DeployBuilderSchema, FirebaseRc } from '../interfaces';

const projectConflictMessage = 'The Firebase Project specified by your angular.json or .firebaserc is in conflict';

/** The two ways to set the `firebaseProject` option, worded as the end of a sentence shown to the user. */
const howToSetFirebaseProject = (angularProjectName: string, projectId: string): string =>
  `add "firebaseProject": "${projectId}" to the deploy options of "${angularProjectName}" in angular.json, ` +
  `or run ng deploy --firebase-project=${projectId}`;

/**
 * Asks which Firebase project to deploy to. Asked only when `.firebaserc` has the Hosting target
 * name under more than one Firebase project.
 * @param projectIds the Firebase projects that have the target name, offered as the choices
 * @param defaultProject the workspace's default project, which the cursor starts on when it is
 *   one of `projectIds`
 */
const firebaseProjectPrompt = async (
  angularProjectName: string,
  projectIds: string[],
  defaultProject: string | undefined,
): Promise<string> => {
  const { projectId } = await inquirer.prompt<{ projectId: string }>({
    type: 'list',
    name: 'projectId',
    choices: projectIds,
    message:
      `.firebaserc lists the Hosting target "${angularProjectName}" under more than one Firebase project. ` +
      'Which one should ng deploy use?',
    default: defaultProject,
  });
  return projectId;
};

/**
 * Chooses the Firebase project to deploy the Angular project `angularProjectName` to.
 *
 * Returns undefined in one case, after printing why: `.firebaserc` has the Hosting target name
 * under more than one Firebase project, the `firebaseProject` option is not set, and there is no
 * terminal to ask the user in, as in an automated job.
 */
export const chooseFirebaseProject = async (
  context: BuilderContext,
  firebaseRc: FirebaseRc,
  angularProjectName: string,
  options: DeployBuilderSchema,
): Promise<string | undefined> => {
  const defaultProject = firebaseRc.projects?.default;

  // App Hosting has no entry in .firebaserc, so no Hosting target name is looked up for it.
  const hostingProjects = options.appHostingBackend ? [] : projectsWithHostingTarget(firebaseRc, angularProjectName);

  if (hostingProjects.length > 1) {
    if (options.firebaseProject) {
      if (!hostingProjects.includes(options.firebaseProject)) { throw new Error(projectConflictMessage); }
      return options.firebaseProject;
    }

    // With no terminal there is nobody to answer a question, so this stops with an error and does not ask.
    if (!process.stdin.isTTY) {
      context.logger.error(
        `.firebaserc lists the Hosting target "${angularProjectName}" under more than one Firebase project ` +
        `(${hostingProjects.join(', ')}), so ng deploy cannot tell which project to deploy to.\n` +
        `To choose one, ${howToSetFirebaseProject(angularProjectName, '<project id>')}.`
      );
      return undefined;
    }

    const answer = await firebaseProjectPrompt(angularProjectName, hostingProjects, defaultProject);
    context.logger.info(`To skip this question, ${howToSetFirebaseProject(angularProjectName, answer)}.`);
    return answer;
  }

  // One project has the target name, or none does and the default project is all there is.
  const projectFromFirebaseRc: string | undefined = hostingProjects[0] ?? defaultProject;
  const firebaseProject = options.firebaseProject || projectFromFirebaseRc;
  if (!firebaseProject) {
    throw new Error('Cannot determine the Firebase Project from your angular.json or .firebaserc');
  }
  if (firebaseProject !== projectFromFirebaseRc) { throw new Error(projectConflictMessage); }
  return firebaseProject;
};
