/**
 * @fileoverview Reads and writes the configuration `ng deploy` needs, during `ng add`.
 *
 * Three files are involved, and each writer below writes one piece of one of them:
 *
 * - `angular.json` gets a `deploy` entry for the Angular project. It tells the Angular CLI that
 *   `ng deploy` runs AngularFire's deploy builder, and with which options.
 * - `firebase.json` says what to upload. It is the Firebase CLI's own configuration file, which
 *   the builder hands the deploy to.
 * - `.firebaserc` says where to upload it. It is also the Firebase CLI's, and records which
 *   Firebase project this workspace uses.
 *
 * The terms used in this file:
 *
 * - Firebase project (`projectId`): the user's project in the Firebase console. `.firebaserc`
 *   lists the one the workspace uses under `projects.default`, the "default project".
 * - Hosting site (`siteId`): one `<siteId>.web.app` address in a Firebase project, where
 *   Firebase Hosting serves uploaded static files. A project can have several.
 * - Hosting target name: a name of our choosing that `firebase.json` uses to refer to a site,
 *   in place of the site's real id. `.firebaserc` then says which real site that name refers
 *   to, separately for each Firebase project.
 *   For example:
 *     - `firebase.json` says "upload these files to `my-app`"
 *     - `.firebaserc` says "in the project `my-project`, `my-app` is the site `my-project-prod`".
 *   Keeping the real id out of `firebase.json` lets the same file deploy to a different site in
 *   another project. AngularFire uses the Angular project's name as the target name.
 * - Hosting entry: one object under the `hosting` key of `firebase.json`. It tells Firebase
 *   Hosting which folder of files to upload and which site to serve them on, either by the
 *   site's real id (`site`) or by a Hosting target name (`target`). The key holds one entry or
 *   a list of entries.
 * - App Hosting backend (`backendId`): what Firebase App Hosting deploys to. A Hosting site only
 *   serves files that were built beforehand. For a backend, App Hosting takes the app's source,
 *   builds it in Google Cloud, and runs the Node.js server program that an Angular app with
 *   server-side rendering includes. That program runs on Cloud Run, in the backend's region,
 *   and is what renders pages on the server.
 *
 * `firebase.json` and `.firebaserc` are read and written on the real filesystem, not through the
 * schematic's Tree, because the Firebase CLI rewrites both on disk during the same `ng add` run.
 * Call these writers after the last Firebase CLI call that touches those files.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Rule, SchematicsException } from '@angular-devkit/schematics';
import { TargetDefinition, updateWorkspace } from '@schematics/angular/utility';
import { BuildTargetDefinition } from '../buildOptions.js';
import { stringifyFormatted } from '../common.js';
import { projectsWithHostingTarget } from '../firebaserc.js';
import {
  DeployChoice, FirebaseAppHostingConfig, FirebaseHostingConfig, FirebaseJSON, FirebaseRc,
} from '../interfaces.js';

/** The name angular.json uses for AngularFire's deploy builder. */
export const deployBuilder = '@angular/fire:deploy';

/**
 * The App Hosting backend that the Angular project's existing `deploy` entry in `angular.json`
 * deploys to. Undefined when the entry deploys to Firebase Hosting, belongs to another tool, or
 * does not exist.
 */
export const existingAppHostingBackend = (deployTarget: BuildTargetDefinition | undefined): string | undefined =>
  deployTarget?.builder === deployBuilder ? deployTarget.options?.appHostingBackend : undefined;

/**
 * Where the Angular project's existing `deploy` entry in `angular.json` already deploys to, as
 * the answer to `ng add`'s deploy question that would keep it. Undefined when the project has no
 * `deploy` entry, or has another tool's.
 */
export const existingDeployChoice = (deployTarget: BuildTargetDefinition | undefined): DeployChoice | undefined => {
  if (deployTarget?.builder !== deployBuilder) { return undefined; }
  if (existingAppHostingBackend(deployTarget)) { return 'apphosting'; }

  /* Without `version: 2`, an entry with `ssr` set deploys the app's server to Cloud Functions or
   * Cloud Run. Setting up Hosting or App Hosting would end that, so only `none` keeps it. */
  const { version, ssr } = deployTarget.options ?? {};
  const deploysServerWithoutVersion2 = (!version || version < 2) && !!ssr;
  return deploysServerWithoutVersion2 ? 'none' : 'hosting';
};

/**
 * The Firebase project that `ng deploy` deploys the Angular project to today, as far as the
 * project's `deploy` entry and `.firebaserc` say. `ng add` starts its project question on it, so
 * that pressing Enter keeps the project. Undefined when the files point to no project.
 */
export const existingFirebaseProject = (
  deployTarget: BuildTargetDefinition | undefined,
  firebaseRc: FirebaseRc,
  hostingTargetName: string,
): string | undefined => {
  const defaultProject = firebaseRc.projects?.default;

  // An App Hosting deploy goes to the default project, whatever Hosting targets the file still has.
  if (existingAppHostingBackend(deployTarget)) { return defaultProject; }

  const hostingProjects = projectsWithHostingTarget(firebaseRc, hostingTargetName);
  if (hostingProjects.length === 1) { return hostingProjects[0]; }

  // With the target name under several projects, the `firebaseProject` deploy option decides.
  const firebaseProjectOption: unknown =
    deployTarget?.builder === deployBuilder ? deployTarget.options?.firebaseProject : undefined;
  if (typeof firebaseProjectOption === 'string' && hostingProjects.includes(firebaseProjectOption)) {
    return firebaseProjectOption;
  }
  return defaultProject ?? hostingProjects[0];
};

/** Reads a JSON file from disk, returning `whenMissing` if the file does not exist. */
const readJsonFromDisk = <Content>(path: string, whenMissing: Content): Content => {
  if (!existsSync(path)) { return whenMissing; }
  try {
    return JSON.parse(readFileSync(path).toString());
  } catch (error) {
    throw new SchematicsException(`Error when parsing ${path}: ${error.message}`);
  }
};

/** firebase.json allows one entry or a list of entries in several places. This always gives a list. */
const asArray = <Entry>(value: Entry | Entry[] | undefined): Entry[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

/**
 * Tells `ng deploy` which Hosting site to deploy the app to, by adding an entry to `.firebaserc`.
 * `firebase.json` refers to the site only by the name `hostingTargetName`. This entry supplies
 * the real site: it says that in the Firebase project `projectId`, the name `hostingTargetName`
 * refers to the site whose id is `siteId`.
 */
export const setHostingTargetInFirebaseRc = (
  projectRoot: string,
  projectId: string,
  hostingTargetName: string,
  siteId: string,
): void => {
  const path = join(projectRoot, '.firebaserc');
  const firebaseRc = readJsonFromDisk<FirebaseRc>(path, {});
  const targetsByProject = firebaseRc.targets ?? {};

  // Add the name under the chosen project, keeping whatever else that project already maps.
  const projectTargets = targetsByProject[projectId] ?? {};
  const hostingTargets = projectTargets.hosting ?? {};
  hostingTargets[hostingTargetName] = [siteId];
  projectTargets.hosting = hostingTargets;
  targetsByProject[projectId] = projectTargets;

  firebaseRc.targets = targetsByProject;
  writeFileSync(path, stringifyFormatted(firebaseRc));
};

/**
 * Reads `.firebaserc` for `ng add`, which writes the file back at the end of the run. A file
 * that cannot be parsed stops the run here with an error, before anything is created.
 */
export const firebaseRcForSetup = (projectRoot: string): FirebaseRc =>
  readJsonFromDisk<FirebaseRc>(join(projectRoot, '.firebaserc'), {});

/**
 * The value to give the `firebaseProject` deploy option, once `.firebaserc` has been written.
 * That is `projectId` when the file has `hostingTargetName` under more than one Firebase project,
 * because `ng deploy` cannot tell from the file which of them to use and would have to ask.
 * Undefined when the file has the name under one Firebase project only. `ng deploy` then deploys
 * to that project and does not need the option.
 */
export const firebaseProjectForDeployOption = (
  projectRoot: string,
  projectId: string,
  hostingTargetName: string,
): string | undefined => {
  const firebaseRc = readJsonFromDisk<FirebaseRc>(join(projectRoot, '.firebaserc'), {});
  return projectsWithHostingTarget(firebaseRc, hostingTargetName).length > 1 ? projectId : undefined;
};

const defaultHostingIgnore = ['firebase.json', '**/.*', '**/node_modules/**'];

/**
 * Finds the Hosting entry that setting up `hostingTargetName` rewrites, and returns its position
 * in `hostingEntries`, or -1 when a new entry is added to the list instead.
 *
 * An existing entry is rewritten in two cases:
 *
 * - An entry already has the target name `hostingTargetName`. It is this Angular project's own
 *   entry from an earlier `ng add`, and adding another would give the same name two entries.
 * - The file's only entry has no target name and no site, which is what `firebase init hosting`
 *   writes. The Firebase CLI deploys such an entry to the project's default site, but only while
 *   it is the file's single entry. In a list of entries, the CLI gives an entry with no target
 *   name and no site nowhere to deploy to. Adding this Angular project's entry would turn the
 *   file into such a list, so the existing entry is rewritten instead of being kept beside it.
 */
const indexOfHostingEntryToReplace = (hostingEntries: FirebaseHostingConfig[], hostingTargetName: string): number => {
  const sameNameIndex = hostingEntries.findIndex(entry => entry.target === hostingTargetName);
  if (sameNameIndex !== -1) { return sameNameIndex; }

  const hasLoneUnnamedEntry =
    hostingEntries.length === 1 && !hostingEntries[0].target && !hostingEntries[0].site;
  return hasLoneUnnamedEntry ? 0 : -1;
};

/**
 * The lone Hosting entry with no target name in `firebase.json`, when setting up
 * `hostingTargetName` would replace it. `ng add` asks the user before doing that, because the
 * entry may be there for something other than this Angular project. Undefined when there is no
 * such entry, or when an entry already has this target name.
 */
export const unnamedHostingEntryToReplace = (
  projectRoot: string,
  hostingTargetName: string,
): FirebaseHostingConfig | undefined => {
  const firebaseJson = readJsonFromDisk<FirebaseJSON>(join(projectRoot, 'firebase.json'), {});
  const hostingEntries = asArray(firebaseJson.hosting);

  const replacedIndex = indexOfHostingEntryToReplace(hostingEntries, hostingTargetName);
  if (replacedIndex === -1) { return undefined; }

  const replacedEntry = hostingEntries[replacedIndex];
  return replacedEntry.target === hostingTargetName ? undefined : replacedEntry;
};

/**
 * Writes the Hosting entry for `hostingTargetName` in `firebase.json`. The entry tells Firebase
 * Hosting two things. First, to upload the files in `publicDirectory`. Second, to serve
 * `clientSidePage` for any URL that matches no uploaded file, so that the Angular router can
 * handle that URL in the browser.
 */
export const setHostingInFirebaseJson = (
  projectRoot: string,
  hostingTargetName: string,
  publicDirectory: string,
  clientSidePage: string,
): void => {
  const path = join(projectRoot, 'firebase.json');
  const firebaseJson = readJsonFromDisk<FirebaseJSON>(path, {});
  const hostingEntries = asArray(firebaseJson.hosting);

  const replacedIndex = indexOfHostingEntryToReplace(hostingEntries, hostingTargetName);
  const replacedEntry = replacedIndex === -1 ? undefined : hostingEntries[replacedIndex];

  // Start from the replaced entry, so settings the user added to it (headers, redirects) survive.
  const entry: FirebaseHostingConfig = { ...replacedEntry };

  // AngularFire before 17.1 wrote these two settings. The Firebase CLI rejects `source` beside `public`.
  delete entry.source;
  delete entry.frameworksBackend;

  entry.target = hostingTargetName;
  entry.public = publicDirectory;
  entry.ignore = replacedEntry?.ignore ?? defaultHostingIgnore;

  /* Hosting uses the first rewrite that matches a URL, so the catch-all goes last, after any
   * rewrites the user already had. An earlier catch-all is dropped so there is only one. */
  const otherRewrites = (replacedEntry?.rewrites ?? []).filter(rewrite => rewrite.source !== '**');
  entry.rewrites = [...otherRewrites, { source: '**', destination: `/${clientSidePage}` }];

  if (replacedIndex === -1) {
    hostingEntries.push(entry);
  } else {
    hostingEntries[replacedIndex] = entry;
  }
  firebaseJson.hosting = hostingEntries;
  writeFileSync(path, stringifyFormatted(firebaseJson));
};

/** What App Hosting should not upload: files it rebuilds or installs itself, and local leftovers. */
const appHostingIgnore = ['node_modules', '.git', '/dist', '.angular', 'firebase-debug.log'];

/**
 * Whether `firebase.json` already says that local files are deployed to the backend `backendId`
 * although it is connected to a GitHub repository. The user agreed to that in an earlier
 * `ng add` run, so the question is not asked again.
 */
export const alreadyDeploysLocalFiles = (projectRoot: string, backendId: string): boolean => {
  const firebaseJson = readJsonFromDisk<FirebaseJSON>(join(projectRoot, 'firebase.json'), {});
  const entry = asArray(firebaseJson.apphosting).find(candidate => candidate.backendId === backendId);
  return entry?.alwaysDeployFromSource === true;
};

/**
 * Lists the App Hosting backend `backendId` in `firebase.json`, which is where the Firebase CLI
 * looks for the backends it may deploy to.
 * @param alwaysDeployFromSource true for a backend that is connected to a GitHub repository,
 *   to tell the Firebase CLI that uploading local files to it is intended
 */
export const setAppHostingInFirebaseJson = (
  projectRoot: string,
  backendId: string,
  alwaysDeployFromSource: boolean,
): void => {
  const path = join(projectRoot, 'firebase.json');
  const firebaseJson = readJsonFromDisk<FirebaseJSON>(path, {});
  const backendEntries = asArray(firebaseJson.apphosting);
  const existingIndex = backendEntries.findIndex(entry => entry.backendId === backendId);
  const existingEntry = existingIndex === -1 ? undefined : backendEntries[existingIndex];

  // Start from the backend's existing entry, so settings the user changed in it survive.
  const entry: FirebaseAppHostingConfig = { ...existingEntry, backendId };

  // The directory holding package.json. The Firebase CLI uploads the whole workspace regardless.
  entry.rootDir = existingEntry?.rootDir ?? '.';

  entry.ignore = existingEntry?.ignore ?? appHostingIgnore;
  if (alwaysDeployFromSource) { entry.alwaysDeployFromSource = true; }

  if (existingIndex === -1) {
    backendEntries.push(entry);
  } else {
    backendEntries[existingIndex] = entry;
  }

  // A single backend is written as one object, and several as a list.
  firebaseJson.apphosting = backendEntries.length === 1 ? backendEntries[0] : backendEntries;
  writeFileSync(path, stringifyFormatted(firebaseJson));
};

/** What `setDeployTarget` writes into the options of the `deploy` entry. */
interface DeployTargetSettings {
  /** The App Hosting backend to deploy to, or undefined to deploy to Firebase Hosting. */
  appHostingBackend: string | undefined;
  /**
   * The value for the `firebaseProject` option, which specifies the Firebase project that
   * `ng deploy` deploys to. Undefined removes the option, when `.firebaserc` is enough to
   * identify the project.
   */
  firebaseProject: string | undefined;
}

/**
 * Writes the Angular project's `deploy` entry in `angular.json`, which makes `ng deploy` run
 * AngularFire's deploy builder.
 */
export const setDeployTarget = (projectName: string, settings: DeployTargetSettings): Rule =>
  updateWorkspace(workspace => {
    const { appHostingBackend, firebaseProject } = settings;

    const project = workspace.projects.get(projectName);
    if (!project) {
      throw new SchematicsException(`The Angular project "${projectName}" is not defined in this workspace`);
    }

    /* An earlier AngularFire `deploy` entry is kept, with its options and its configurations, which
     * the user may have added to. Another tool's entry would mean nothing to this builder, so it
     * is replaced. */
    const existing = project.targets.get('deploy');
    const earlierEntry = existing?.builder === deployBuilder ? existing : undefined;
    const options: NonNullable<TargetDefinition['options']> = { ...earlierEntry?.options };

    // 2 selects the builder's current behavior. Without it the builder takes its legacy paths.
    options.version = 2;

    // Present means App Hosting and absent means Hosting, so a switch to Hosting has to remove it.
    if (appHostingBackend) {
      options.appHostingBackend = appHostingBackend;
    } else {
      delete options.appHostingBackend;
    }

    /* `ng deploy` stops with an error when this option differs from the site `.firebaserc` has
     * for the app. A value left from an earlier setup would do that right after a run that
     * picked another site, so the earlier value is never kept. */
    delete options.firebaseHostingSite;

    /* The `firebaseProject` option specifies the Firebase project that `ng deploy` deploys to. A
     * value left from an earlier `ng add` run with another project would send deploys to that
     * project, or stop them with an error, so the earlier value is never kept. */
    if (firebaseProject) {
      options.firebaseProject = firebaseProject;
    } else {
      delete options.firebaseProject;
    }

    // Only the options of an earlier entry are written, which leaves its configurations as they are.
    if (earlierEntry) {
      earlierEntry.options = options;
    } else {
      project.targets.set('deploy', { builder: deployBuilder, options });
    }
  });

// Kept in step with the `appHostingBackend` pattern in deploy/schema.json.
const backendIdPattern = /^[a-z](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Whether App Hosting accepts `backendId` as the id of a new backend. The Firebase CLI applies
 * this rule only when it asks for the id itself, which it does not do for `ng add`.
 */
export const isValidBackendId = (backendId: string): boolean =>
  backendId.length >= 3 && backendId.length <= 30 && backendIdPattern.test(backendId);

/** A backend id suggested from the Angular project name, or undefined when none can be derived. */
export const backendIdFromProjectName = (projectName: string): string | undefined => {
  const candidate = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^[^a-z]+/, '')
    .slice(0, 30)
    .replace(/-+$/, '');
  return isValidBackendId(candidate) ? candidate : undefined;
};
