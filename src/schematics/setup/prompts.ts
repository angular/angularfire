import * as fuzzy from 'fuzzy';
import * as inquirer from 'inquirer';
import { featureOptions, FEATURES, FirebaseApp, FirebaseHostingSite, FirebaseProject, PROJECT_TYPE, WorkspaceProject } from '../interfaces';
import { hasPrerenderOption, isUniversalApp, shortAppId } from '../utils';
import { getFirebaseTools } from '../firebaseTools';
import { shortSiteName } from '../common';

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const NEW_OPTION = '~~angularfire-new~~';
const DEFAULT_SITE_TYPE = 'DEFAULT_SITE';

// `fuzzy` passes either the original list of projects or an internal object
// which contains the project as a property.
const isProject = (elem: FirebaseProject | fuzzy.FilterResult<FirebaseProject>): elem is FirebaseProject => {
    return (elem as { original: FirebaseProject }).original === undefined;
};

const isApp = (elem: FirebaseApp | fuzzy.FilterResult<FirebaseApp>): elem is FirebaseApp => {
    return (elem as { original: FirebaseApp }).original === undefined;
};

const isSite = (elem: FirebaseHostingSite | fuzzy.FilterResult<FirebaseHostingSite>): elem is FirebaseHostingSite => {
    return (elem as { original: FirebaseHostingSite }).original === undefined;
};

export const searchProjects = (promise: Promise<FirebaseProject[]>) =>
    (_: any, input: string) => promise.then(projects => {
        projects.unshift({
            projectId: NEW_OPTION,
            displayName: '[CREATE NEW PROJECT]'
        } as any);
        return fuzzy.filter(input, projects, {
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

export const searchApps = (promise: Promise<FirebaseApp[]>) =>
  (_: any, input: string) => promise.then(apps => {
    apps.unshift({
      appId: NEW_OPTION,
      displayName: '[CREATE NEW APP]',
    } as any);
    return fuzzy.filter(input, apps, {
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

export const searchSites = (promise: Promise<FirebaseHostingSite[]>) =>
  (_: any, input: string) => promise.then(sites => {
    sites.unshift({
      name: NEW_OPTION,
      defaultUrl: '[CREATE NEW SITE]',
    } as any);
    return fuzzy.filter(input, sites, {
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


type Prompt = <K extends string, U= unknown>(questions: { name: K, source: (...args) =>
  Promise<{ value: U }[]>, default?: U | ((o: U[]) => U | Promise<U>), [key: string]: any }) =>
    Promise<{[T in K]: U }>;

const autocomplete: Prompt = (questions) => inquirer.prompt(questions);


export const featuresPrompt = async (): Promise<FEATURES[]> => {
  const { features } = await inquirer.prompt({
    type: 'checkbox',
    name: 'features',
    choices: featureOptions,
    message: 'What features would you like to setup?',
    default: [FEATURES.Hosting],
  });
  return features;
};

export const userPrompt = async (options: {}): Promise<Record<string, any>> => {
  const firebaseTools = await getFirebaseTools();
  const users = await firebaseTools.login.list();
  if (!users || users.length === 0) {
    await firebaseTools.login(); // first login isn't returning anything of value
    const user = await firebaseTools.login(options);
    return user;
  } else {
    const defaultUser = await firebaseTools.login(options);
    const choices = users.map(({user}) => ({ name: user.email, value: user }));
    const newChoice = { name: '[Login in with another account]', value: NEW_OPTION };
    const { user } = await inquirer.prompt({
      type: 'list',
      name: 'user',
      choices: [newChoice].concat(choices as any), // TODO types
      message: 'Which Firebase account would you like to use?',
      default: choices.find(it => it.value.email === defaultUser.email)?.value,
    });
    if (user === NEW_OPTION) {
      const { user } = await firebaseTools.login.add();
      return user;
    }
    return user;
  }
};

export const projectPrompt = async (defaultProject: string|undefined, options: {}) => {
  const firebaseTools = await getFirebaseTools();
  const projects = firebaseTools.projects.list(options);
  const { projectId } = await autocomplete({
    type: 'autocomplete',
    name: 'projectId',
    source: searchProjects(projects),
    message: 'Please select a project:',
    default: defaultProject,
  });
  if (projectId === NEW_OPTION) {
    const { projectId } = await inquirer.prompt({
      type: 'input',
      name: 'projectId',
      message: `Please specify a unique project id (cannot be modified afterward) [6-30 characters]:`,
    });
    const { displayName } = await inquirer.prompt({
      type: 'input',
      name: 'displayName',
      message: 'What would you like to call your project?',
      default: projectId,
    });
    return await firebaseTools.projects.create(projectId, { ...options, displayName, nonInteractive: true });
  }
  // tslint:disable-next-line:no-non-null-assertion
  return (await projects).find(it => it.projectId === projectId)!;
};

export const appPrompt = async ({ projectId: project }: FirebaseProject, defaultAppId: string|undefined, options: {}) => {
  const firebaseTools = await getFirebaseTools();
  const apps = firebaseTools.apps.list('web', { ...options, project });
  const { appId } = await autocomplete({
    type: 'autocomplete',
    name: 'appId',
    source: searchApps(apps),
    message: 'Please select an app:',
    default: defaultAppId,
  });
  if (appId === NEW_OPTION) {
    const { displayName } = await inquirer.prompt({
      type: 'input',
      name: 'displayName',
      message: 'What would you like to call your app?',
    });
    return await firebaseTools.apps.create('web', displayName, { ...options, nonInteractive: true, project });
  }
  // tslint:disable-next-line:no-non-null-assertion
  return (await apps).find(it => shortAppId(it) === appId)!;
};

export const sitePrompt = async ({ projectId: project }: FirebaseProject, options: {}) => {
  const firebaseTools = await getFirebaseTools();
  const sites = firebaseTools.hosting.sites.list({ ...options, project }).then(it => {
    if (it.sites.length === 0) {
      // newly created projects don't return their default site, stub one
      return [{
        name: project,
        defaultUrl: `https://${project}.web.app`,
        type: DEFAULT_SITE_TYPE,
        appId: undefined,
      } as FirebaseHostingSite];
    } else {
      return it.sites;
    }
  });
  const { siteName } = await autocomplete({
    type: 'autocomplete',
    name: 'siteName',
    source: searchSites(sites),
    message: 'Please select a hosting site:',
    default: _ => sites.then(it => shortSiteName(it.find(it => it.type === DEFAULT_SITE_TYPE))),
  });
  if (siteName === NEW_OPTION) {
    const { subdomain } = await inquirer.prompt({
      type: 'input',
      name: 'subdomain',
      message: 'Please provide an unique, URL-friendly id for the site (<id>.web.app):',
    });
    return await firebaseTools.hosting.sites.create(subdomain, { ...options, nonInteractive: true, project });
  }
  // tslint:disable-next-line:no-non-null-assertion
  return (await sites).find(it => shortSiteName(it) === siteName)!;
};

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
      const { shouldPrerender } = await inquirer.prompt({
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
    const { projectType } = await inquirer.prompt({
      type: 'list',
      name: 'projectType',
      choices,
      message: 'How would you like to render server-side content?',
      default: PROJECT_TYPE.CloudFunctions,
    });
    if (projectType === PROJECT_TYPE.CloudFunctions) {
      const { newNodeVersion } = await inquirer.prompt({
        type: 'list',
        name: 'newNodeVersion',
        choices: ['12', '14', '16'],
        message: 'What version of Node.js would you like to use?',
        default: parseInt(process.versions.node, 10).toString(),
      });
      nodeVersion = newNodeVersion;
    } else if (projectType === PROJECT_TYPE.CloudRun) {
      const fetch = require('node-fetch');
      const { newNodeVersion } = await inquirer.prompt({
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
