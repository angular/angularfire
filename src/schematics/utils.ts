import { readFileSync } from 'fs';
import { FirebaseRc, FirebaseProject, Workspace, WorkspaceProject, FirebaseApp, FirebaseHostingSite, FirebaseTools, DeployOptions } from './interfaces';
import { join } from 'path';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { FilterResult } from 'fuzzy';

const NEW_OPTION = '~~angularfire-new~~';
const DEFAULT_SITE_TYPE = 'DEFAULT_SITE';

// We consider a project to be a universal project if it has a `server` architect
// target. If it does, it knows how to build the application's server.
export const isUniversalApp = (
  project: WorkspaceProject
) => project.architect?.server;

export const hasPrerenderOption = (
  project: WorkspaceProject
) => project.architect?.prerender;


export const getFirebaseTools = (): FirebaseTools => {
  globalThis.memoizedFirebaseTools ||= require('firebase-tools');
  return globalThis.memoizedFirebaseTools;
};

const getFuzzy = (): typeof import('fuzzy') => {
  globalThis.memoizedFuzzy ||= require('fuzzy');
  return globalThis.memoizedFuzzy;
};

const getInquirer = (): typeof import('inquirer') => {
  if (globalThis.memeoizedInquirer) {
    return globalThis.memeoizedInquirer;
  } else {
    const inquirer = require('inquirer');
    inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
    globalThis.memeoizedInquirer = inquirer;
    return inquirer;
  }
};

const getJSONCParser = (): typeof import('jsonc-parser') => {
  globalThis.memoizedJSONCParser ||= require('jsonc-parser');
  return globalThis.memoizedJSONCParser;
};

// `fuzzy` passes either the original list of projects or an internal object
// which contains the project as a property.
const isProject = (elem: FirebaseProject | FilterResult<FirebaseProject>): elem is FirebaseProject => {
  return (elem as { original: FirebaseProject }).original === undefined;
};

const isApp = (elem: FirebaseApp | FilterResult<FirebaseApp>): elem is FirebaseApp => {
  return (elem as { original: FirebaseApp }).original === undefined;
};

const isSite = (elem: FirebaseHostingSite | FilterResult<FirebaseHostingSite>): elem is FirebaseHostingSite => {
  return (elem as { original: FirebaseHostingSite }).original === undefined;
};

export const searchProjects = (promise: Promise<FirebaseProject[]>) =>
  (_: any, input: string) => promise.then(projects => {
    projects.unshift({
      projectId: NEW_OPTION,
      displayName: '[CREATE NEW PROJECT]'
    } as any);
    return getFuzzy().filter(input, projects, {
      extract(el) {
        return `${el.projectId} ${el.displayName}`;
      }
    }).map((result) => {
      let original: FirebaseProject;
      if (isProject(result)) {
        original = result;
      } else {
        original = result.original;
      }
      return {
        name: original.displayName,
        title: original.displayName,
        value: original.projectId
      };
    });
  });

const shortAppId = (app?: FirebaseApp) => app?.appId && app.appId.split('/').pop();

export const searchApps = (promise: Promise<FirebaseApp[]>) =>
  (_: any, input: string) => promise.then(apps => {
    apps.unshift({
      appId: NEW_OPTION,
      displayName: '[CREATE NEW APP]',
    } as any);
    return getFuzzy().filter(input, apps, {
      extract(el: FirebaseApp) {
        return el.displayName;
      }
    }).map((result) => {
      let original: FirebaseApp;
      if (isApp(result)) {
        original = result;
      } else {
        original = result.original;
      }
      return {
        name: original.displayName,
        title: original.displayName,
        value: shortAppId(original),
      };
    });
  });

export const shortSiteName = (site?: FirebaseHostingSite) => site?.name && site.name.split('/').pop();

export const searchSites = (promise: Promise<FirebaseHostingSite[]>) =>
  (_: any, input: string) => promise.then(sites => {
    sites.unshift({
      name: NEW_OPTION,
      defaultUrl: '[CREATE NEW SITE]',
    } as any);
    return getFuzzy().filter(input, sites, {
      extract(el) {
        return el.defaultUrl;
      }
    }).map((result) => {
      let original: FirebaseHostingSite;
      if (isSite(result)) {
        original = result;
      } else {
        original = result.original;
      }
      return {
        name: original.defaultUrl,
        title: original.defaultUrl,
        value: shortSiteName(original),
      };
    });
  });

export function getWorkspace(
  host: Tree
): { path: string; workspace: Workspace } {
  const possibleFiles = ['/angular.json', '/.angular.json'];
  const path = possibleFiles.filter(p => host.exists(p))[0];

  const configBuffer = host.read(path);
  if (configBuffer === null) {
    throw new SchematicsException(`Could not find angular.json`);
  }

  const { parse } = getJSONCParser();

  const workspace = parse(configBuffer.toString()) as Workspace|undefined;
  if (!workspace) {
    throw new SchematicsException('Could not parse angular.json');
  }

  return {
    path,
    workspace
  };
}

export const getProject = (options: DeployOptions, host: Tree) => {
  const { workspace } = getWorkspace(host);
  const projectName = options.project || workspace.defaultProject;

  if (!projectName) {
    throw new SchematicsException(
      'No Angular project selected and no default project in the workspace'
    );
  }

  const project = workspace.projects[projectName];
  if (!project) {
    throw new SchematicsException(
      'The specified Angular project is not defined in this workspace'
    );
  }

  if (project.projectType !== 'application') {
    throw new SchematicsException(
      `Deploy requires an Angular project type of "application" in angular.json`
    );
  }

  return {project, projectName};
};

type Prompt = <K extends string, U= unknown>(questions: { name: K, source: (...args) =>
  Promise<{ value: U }[]>, default?: U | ((o: U[]) => U | Promise<U>), [key: string]: any }) =>
    Promise<{[T in K]: U }>;

const autocomplete: Prompt = (questions) => getInquirer().prompt(questions);

export enum FEATURES {
  Authentication = 'Authentication',
  Analytics = 'Analytics',
  Database = 'Realtime Database',
  Functions = 'Cloud Functions',
  Hosting = 'Hosting',
  Messaging = 'Cloud Messaging',
  Performance = 'Performance Monitoring',
  Firestore = 'Firestore',
  Storage = 'Storage',
  RemoteConfig = 'Remote Config',
}

export const featuresPrompt = async (): Promise<FEATURES[]> => {
  const choices = Object.entries(FEATURES).map(([value, name]) => ({ name, value }));
  const { features } = await getInquirer().prompt({
    type: 'checkbox',
    name: 'features',
    choices,
    message: 'What features would you like to setup?',
    default: [FEATURES.Hosting],
  });
  return features;
};

export const projectPrompt = async (defaultProject?: string) => {
  const firebase = getFirebaseTools();
  const projects = firebase.projects.list({});
  const { projectId } = await autocomplete({
    type: 'autocomplete',
    name: 'projectId',
    source: searchProjects(projects),
    message: 'Please select a project:',
    default: defaultProject,
  });
  if (projectId === NEW_OPTION) {
    const { projectId } = await getInquirer().prompt({
      type: 'input',
      name: 'projectId',
      message: `Please specify a unique project id (cannot be modified afterward) [6-30 characters]:`,
    });
    const { displayName } = await getInquirer().prompt({
      type: 'input',
      name: 'displayName',
      message: 'What would you like to call your project?',
      default: projectId,
    });
    // TODO try/catch
    const project = await firebase.projects.create(projectId, { displayName, nonInteractive: true });
    // The default hosting site won't be returned on a new project (hosting.sites.list()) until we try to create one, intentionally trigger
    // the `site YADA already exists in YADA` error to kick this
    if (project.resources.hostingSite) {
      await firebase.hosting.sites.create(project.resources.hostingSite,
        { nonInteractive: true, project: project.projectId }
      ).catch(it => undefined);
    }
    return project;
  }
  // tslint:disable-next-line:no-non-null-assertion
  return (await projects).find(it => it.projectId === projectId)!;
};

export const appPrompt = async ({ projectId: project }: FirebaseProject, defaultAppId: string|undefined) => {
  const firebase = getFirebaseTools();
  const apps = firebase.apps.list('web', { project });
  const { appId } = await autocomplete({
    type: 'autocomplete',
    name: 'appId',
    source: searchApps(apps),
    message: 'Please select an app:',
    default: defaultAppId,
  });
  if (appId === NEW_OPTION) {
    const { displayName } = await getInquirer().prompt({
      type: 'input',
      name: 'displayName',
      message: 'What would you like to call your app?',
    });
    return await firebase.apps.create('web', displayName, { nonInteractive: true, project });
  }
  // tslint:disable-next-line:no-non-null-assertion
  return (await apps).find(it => shortAppId(it) === appId)!;
};

export const sitePrompt = async ({ projectId: project }: FirebaseProject, defaultSite: string|undefined) => {
  const firebase = getFirebaseTools();
  if (!firebase.hosting.sites) {
    return undefined;
  }
  const sites = firebase.hosting.sites.list({ project }).then(it => it.sites);
  const { siteName } = await autocomplete({
    type: 'autocomplete',
    name: 'siteName',
    source: searchSites(sites),
    message: 'Please select a hosting site:',
    default: _ => sites.then(it => shortSiteName(it.find(it => shortSiteName(it) === defaultSite || it.type === DEFAULT_SITE_TYPE))),
  });
  if (siteName === NEW_OPTION) {
    const { subdomain } = await getInquirer().prompt({
      type: 'input',
      name: 'subdomain',
      message: 'Please provide an unique, URL-friendly id for the site (<id>.web.app):',
    });
    return await firebase.hosting.sites.create(subdomain, { nonInteractive: true, project });
  }
  // tslint:disable-next-line:no-non-null-assertion
  return (await sites).find(it => shortSiteName(it) === siteName)!;
};

export const prerenderPrompt = (project: WorkspaceProject, prerender: boolean): Promise<{ projectType: PROJECT_TYPE }> => {
  if (isUniversalApp(project)) {
    return getInquirer().prompt({
      type: 'prompt',
      name: 'prerender',
      message: 'We detected an Angular Universal project. How would you like to render server-side content?',
      default: true
    });
  }
  return Promise.resolve({ projectType: PROJECT_TYPE.Static });
};

export const enum PROJECT_TYPE { Static, CloudFunctions, CloudRun }

export const projectTypePrompt = async (project: WorkspaceProject, name: string) => {
  let prerender = false;
  let nodeVersion: string|undefined;
  let serverTarget: string|undefined;
  let browserTarget = `${name}:build:${project.architect?.build?.defaultConfiguration || 'production'}`;
  let prerenderTarget: string|undefined;
  if (isUniversalApp(project)) {
    serverTarget = `${name}:server:${project.architect?.server?.defaultConfiguration || 'production'}`;
    browserTarget = `${name}:build:${project.architect?.build?.defaultConfiguration || 'production'}`;
    if (hasPrerenderOption(project)) {
      prerenderTarget = `${name}:prerender:${project.architect?.prerender?.defaultConfiguration || 'production'}`;
      const { shouldPrerender } = await getInquirer().prompt({
        type: 'confirm',
        name: 'shouldPrerender',
        message: 'Should we prerender before deployment?',
        default: true
      });
      prerender = shouldPrerender;
    }
    const choices = [
      { name: prerender ? 'Pre-render only' : 'Don\'t render universal content', value: PROJECT_TYPE.Static },
      { name: 'Cloud Functions', value: PROJECT_TYPE.CloudFunctions },
      { name: 'Cloud Run', value: PROJECT_TYPE.CloudRun },
    ];
    const { projectType } = await getInquirer().prompt({
      type: 'list',
      name: 'projectType',
      choices,
      message: 'How would you like to render server-side content?',
      default: PROJECT_TYPE.CloudFunctions,
    });
    if (projectType === PROJECT_TYPE.CloudFunctions) {
      const { newNodeVersion } = await getInquirer().prompt({
        type: 'list',
        name: 'newNodeVersion',
        choices: ['12', '14', '16'],
        message: 'What version of Node.js would you like to use?',
        default: parseInt(process.versions.node, 10).toString(),
      });
      nodeVersion = newNodeVersion;
    } else if (projectType === PROJECT_TYPE.CloudRun) {
      const fetch = require('node-fetch');
      const { newNodeVersion } = await getInquirer().prompt({
        type: 'input',
        name: 'newNodeVersion',
        message: 'What version of Node.js would you like to use?',
        validate: it => fetch(`https://hub.docker.com/v2/repositories/library/node/tags/${it}-slim`).then(it => it.status === 200 || `Can't find node:${it}-slim docker image.`),
        default: parseFloat(process.versions.node).toString(),
      });
      nodeVersion = newNodeVersion;
    }
    return { prerender, projectType, nodeVersion, browserTarget, serverTarget, prerenderTarget };
  }
  return { projectType: PROJECT_TYPE.Static, prerender, nodeVersion, browserTarget, serverTarget, prerenderTarget };
};

export function getFirebaseProjectName(
  workspaceRoot: string,
  target: string
): [string|undefined, string|undefined] {
  try {
    const rc: FirebaseRc = JSON.parse(
      readFileSync(join(workspaceRoot, '.firebaserc'), 'UTF-8')
    );
    const defaultProject = rc.projects?.default;
    const project = Object.keys(rc.targets || {}).find(
      project => !!rc.targets?.[project]?.hosting?.[target]
    );
    const site = project && rc.targets?.[project]?.hosting?.[target]?.[0];
    return [project || defaultProject, site];
  } catch (e) {
    return [undefined, undefined];
  }
}
