import { spawnSync } from 'child_process';
import * as fuzzy from 'fuzzy';
import * as inquirer from 'inquirer';
import { getFirebaseTools } from '../firebaseTools';
import { FEATURES, FirebaseApp, FirebaseProject, featureOptions } from '../interfaces';
import { shortAppId } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const NEW_OPTION = '~~angularfire-new~~';

// `fuzzy` passes either the original list of projects or an internal object
// which contains the project as a property.
const isProject = (elem: FirebaseProject | fuzzy.FilterResult<FirebaseProject>): elem is FirebaseProject => {
    return (elem as { original: FirebaseProject }).original === undefined;
};

const isApp = (elem: FirebaseApp | fuzzy.FilterResult<FirebaseApp>): elem is FirebaseApp => {
    return (elem as { original: FirebaseApp }).original === undefined;
};

export const searchProjects = (projects: FirebaseProject[]) =>
  // eslint-disable-next-line @typescript-eslint/require-await
    async (_: any, input: string) => {
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
    };

export const searchApps = (apps: FirebaseApp[]) =>
  // eslint-disable-next-line @typescript-eslint/require-await
  async (_: any, input: string) => {
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
  };

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
    default: [],
  }) as { features: FEATURES[] };
  return features;
};

export const userPrompt = async (options: { projectRoot: string }): Promise<Record<string, any>> => {
  const firebaseTools = await getFirebaseTools();
  let loginList = await firebaseTools.login.list();
  if (!Array.isArray(loginList) || loginList.length === 0) {
    spawnSync('firebase login', { shell: true, cwd: options.projectRoot, stdio: 'inherit' });
    return await firebaseTools.login(options);
  } else {
    const defaultUser = await firebaseTools.login(options);
    const choices = loginList.map(({user}) => ({ name: user.email, value: user }));
    const newChoice = { name: '[Login in with another account]', value: NEW_OPTION };
    const { user } = await inquirer.prompt({
      type: 'list',
      name: 'user',
      choices: [newChoice].concat(choices as any), // TODO types
      message: 'Which Firebase account would you like to use?',
      default: choices.find(it => it.value.email === defaultUser.email)?.value,
    }) as any;
    if (user === NEW_OPTION) {
      spawnSync('firebase login:add', { shell: true, cwd: options.projectRoot, stdio: 'inherit' });
      loginList = await firebaseTools.login.list();
      if (!Array.isArray(loginList)) {
        throw new Error("firebase login:list did not respond as expected");
      }
      const priorEmails = choices.map(it => it.name);
      const newLogin = loginList.find(it => !priorEmails.includes(it.user.email));
      if (!newLogin) {
        throw new Error("Did not find a new user.");
      }
      return newLogin.user;
    }
    return user;
  }
};

export const projectPrompt = async (defaultProject: string|undefined, options: unknown) => {
  const firebaseTools = await getFirebaseTools();
  const projects = await firebaseTools.projects.list(options);
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
    }) as { projectId: string };
    const { displayName } = await inquirer.prompt({
      type: 'input',
      name: 'displayName',
      message: 'What would you like to call your project?',
      default: projectId,
    }) as { displayName: string };
    return await firebaseTools.projects.create(projectId, { account: (options as any).account, displayName, nonInteractive: true });
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (projects).find(it => it.projectId === projectId)!;
};

export const appPrompt = async ({ projectId: project }: FirebaseProject, defaultAppId: string|undefined, options: any) => {
  const firebaseTools = await getFirebaseTools();
  const apps = await firebaseTools.apps.list('web', { ...options, project });
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
    }) as { displayName: string };
    return await firebaseTools.apps.create('web', displayName, { ...options, nonInteractive: true, project });
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (apps).find(it => shortAppId(it) === appId)!;
};
