/**
 * @fileoverview The questions `ng add` asks to set up `ng deploy`: where to deploy, and then
 * which Firebase Hosting site or which Firebase App Hosting backend. `sitePrompt` also lists the
 * project's Hosting sites and creates a new one when asked. The others only ask and return the
 * answers, which `appHosting.ts` and `index.ts` act on.
 */

import inquirer from 'inquirer';
import { shortSiteName } from '../common.js';
import { getFirebaseTools } from '../firebaseTools.js';
import {
  AppHostingBackend, DeployChoice, FirebaseHostingSite, FirebaseProject, FirebaseToolsCommandOptions,
} from '../interfaces.js';
import { appHostingRegions } from './appHostingRegions.js';
import { isValidBackendId } from './deployConfigs.js';
import { NEW_OPTION } from './prompts.js';

const deployPromptMessage = 'How do you want to deploy this app?';

/**
 * Asks where `ng deploy` should deploy the app.
 * @param preselected the choice the cursor starts on
 */
export const deployPrompt = async (preselected: DeployChoice): Promise<DeployChoice> => {
  const choices: { name: string, value: DeployChoice }[] = [
    { name: 'Firebase App Hosting (server-side rendering)', value: 'apphosting' },
    { name: 'Firebase Hosting (static and client-rendered apps)', value: 'hosting' },
    { name: "Don't set up deployment", value: 'none' },
  ];
  const { deploy } = await inquirer.prompt<{ deploy: DeployChoice }>({
    type: 'list',
    name: 'deploy',
    choices,
    message: deployPromptMessage,
    default: preselected,
  });
  return deploy;
};

/**
 * Asks for the id of a new Hosting site.
 * @param suggestedId offered as the answer that pressing Enter gives, when there is one
 */
const newSiteIdPrompt = async (message: string, suggestedId: string | undefined): Promise<string> => {
  const { siteId } = await inquirer.prompt<{ siteId: string }>({
    type: 'input',
    name: 'siteId',
    message,
    default: suggestedId,
    validate: (input: string) => !!input.trim() || 'Please provide a site id.',
  });
  return siteId;
};

/**
 * Asks which Firebase Hosting site of `project` the app should deploy to. A site is one
 * `<siteId>.web.app` address. The user can pick an existing site or create a new one. For a
 * project with no site yet, the user is asked for the id of its first site.
 * @param projectRoot the workspace root on disk
 * @param existingSiteId the site the app already deploys to, if any, which the cursor starts on
 * @param otherTargetBySite the project's sites that another Hosting target name already deploys
 *   to, each paired with that target name. They are marked in the list, and the cursor does not
 *   start on one, because two apps deploying to one site replace each other.
 */
export const sitePrompt = async (
  project: FirebaseProject,
  projectRoot: string,
  existingSiteId: string | undefined,
  otherTargetBySite: Record<string, string>,
): Promise<FirebaseHostingSite> => {
  const firebaseTools = await getFirebaseTools();
  const { projectId } = project;

  // A function instead of one shared object. Each Firebase CLI call needs a new options object.
  const newCallOptions = (): FirebaseToolsCommandOptions => ({ project: projectId, projectRoot });

  const createSite = (siteId: string) =>
    firebaseTools.hosting.sites.create(siteId, { ...newCallOptions(), nonInteractive: true });

  const { sites } = await firebaseTools.hosting.sites.list(newCallOptions());

  // A project's first site stays its default site for good, so the user chooses its id.
  if (sites.length === 0) {
    const firstSiteId = await newSiteIdPrompt(
      'This Firebase project has no Hosting site yet. Please provide a unique, URL-friendly id ' +
      'for its first site (<id>.web.app):',
      projectId,
    );
    return createSite(firstSiteId);
  }

  const otherTargetOf = (site: FirebaseHostingSite): string | undefined => {
    const siteId = shortSiteName(site);
    return siteId ? otherTargetBySite[siteId] : undefined;
  };
  const existingSiteChoices = sites.map(site => {
    const otherTarget = otherTargetOf(site);
    const usedBy = otherTarget ? ` [used by ${otherTarget}]` : '';
    return { name: `${shortSiteName(site)} (${site.defaultUrl})${usedBy}`, value: site };
  });

  // The cursor starts on the app's own site. Without one, it starts on a site no other app uses.
  const existingSite = sites.find(candidate => shortSiteName(candidate) === existingSiteId);
  const defaultSite = sites.find(candidate => candidate.type === 'DEFAULT_SITE');
  const unusedSite = [defaultSite, ...sites].find(candidate => !!candidate && !otherTargetOf(candidate));

  const { site } = await inquirer.prompt<{ site: FirebaseHostingSite | typeof NEW_OPTION }>({
    type: 'list',
    name: 'site',
    choices: [...existingSiteChoices, { name: '[CREATE NEW SITE]', value: NEW_OPTION }],
    message: 'Please select a Hosting site:',
    default: existingSite ?? unusedSite ?? NEW_OPTION,
  });
  if (site !== NEW_OPTION) { return site; }

  const newSiteId = await newSiteIdPrompt(
    'Please provide a unique, URL-friendly id for the site (<id>.web.app):',
    undefined,
  );
  return createSite(newSiteId);
};

/** The id the user gave a backend, which is the last segment of its full resource name. */
const backendIdOf = (backend: AppHostingBackend): string => backend.name.split('/').pop() ?? backend.name;

/** What the user answered when asked which App Hosting backend to deploy to. */
export interface AppHostingBackendChoice {
  backendId: string;
  /** The region to create the backend in. Undefined when an existing backend was chosen. */
  newBackendRegion?: string;
  /**
   * Whether the chosen backend is connected to a GitHub repository, in which case App Hosting
   * currently deploys it from that repository's commits. Always false for a new backend.
   */
  linkedToGitHub: boolean;
}

/**
 * Asks the user to pick one of the project's existing backends or to create a new one.
 * @param existingBackendId the backend the app already deploys to, if any, which the cursor starts on
 */
const chooseBackendPrompt = async (
  backends: AppHostingBackend[],
  existingBackendId: string | undefined,
): Promise<AppHostingBackend | typeof NEW_OPTION> => {
  const existingBackendChoices = backends.map(backend => ({
    name: backend.codebase?.repository
      ? `${backendIdOf(backend)} (deploys from GitHub today)`
      : backendIdOf(backend),
    value: backend,
  }));
  const { backend } = await inquirer.prompt<{ backend: AppHostingBackend | typeof NEW_OPTION }>({
    type: 'list',
    name: 'backend',
    choices: [...existingBackendChoices, { name: '[CREATE NEW BACKEND]', value: NEW_OPTION }],
    message: 'Please select an App Hosting backend:',
    // Without a backend of the app's own, the cursor starts on creating one, not on another app's backend.
    default: backends.find(candidate => backendIdOf(candidate) === existingBackendId) ?? NEW_OPTION,
  });
  return backend;
};

/**
 * Asks for the id of a new backend, refusing ids App Hosting would reject or the project already uses.
 * @param takenIds the ids of the project's existing backends
 * @param suggestedId offered as the default answer when it is not taken
 */
const newBackendIdPrompt = async (takenIds: string[], suggestedId: string | undefined): Promise<string> => {
  const validate = (input: string): string | true => {
    if (!isValidBackendId(input)) {
      return 'Use 3 to 30 lowercase letters, numbers and hyphens, starting with a letter and not ending with a hyphen.';
    }
    if (takenIds.includes(input)) {
      return `This project already has a backend named ${input}.`;
    }
    return true;
  };
  const suggestionIsFree = suggestedId !== undefined && !takenIds.includes(suggestedId);
  const { backendId } = await inquirer.prompt<{ backendId: string }>({
    type: 'input',
    name: 'backendId',
    message: 'Please provide an id for the new backend [3-30 characters: lowercase letters, numbers, hyphens]:',
    default: suggestionIsFree ? suggestedId : undefined,
    validate,
  });
  return backendId;
};

/** The region the cursor starts on in the region question. */
const preselectedRegion = 'us-east4';

/** Asks which region a new backend should run in: one from the known list, or one typed by hand. */
const regionPrompt = async (): Promise<string> => {
  const knownRegionChoices = appHostingRegions.map(({ id, name }) => ({ name: `${id} (${name})`, value: id }));
  const { region } = await inquirer.prompt<{ region: string }>({
    type: 'list',
    name: 'region',
    choices: [...knownRegionChoices, { name: '[ANOTHER REGION]', value: NEW_OPTION }],
    message: 'Please select a region for the backend:',
    default: preselectedRegion,
  });
  if (region !== NEW_OPTION) { return region; }

  // The known list is refreshed at release time, so a region newer than the release is typed in.
  const { typedRegion } = await inquirer.prompt<{ typedRegion: string }>({
    type: 'input',
    name: 'typedRegion',
    message: 'Please provide the region id, such as us-central1:',
    validate: (input: string) => /^[a-z]+-[a-z]+\d+$/.test(input) || 'A region id looks like us-central1.',
  });
  return typedRegion;
};

/**
 * Asks which App Hosting backend the app should deploy to.
 * @param backends the project's existing backends
 * @param suggestedBackendId the default id offered if the user creates a new backend
 * @param existingBackendId the backend the app already deploys to, if any, which the cursor starts on
 */
export const appHostingBackendPrompt = async (
  backends: AppHostingBackend[],
  suggestedBackendId: string | undefined,
  existingBackendId: string | undefined,
): Promise<AppHostingBackendChoice> => {
  // With no existing backends there is nothing to pick from, so go straight to creating one.
  const selected = backends.length === 0 ? NEW_OPTION : await chooseBackendPrompt(backends, existingBackendId);

  if (selected !== NEW_OPTION) {
    return { backendId: backendIdOf(selected), linkedToGitHub: !!selected.codebase?.repository };
  }

  const backendId = await newBackendIdPrompt(backends.map(backendIdOf), suggestedBackendId);
  const newBackendRegion = await regionPrompt();
  return { backendId, newBackendRegion, linkedToGitHub: false };
};
