import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { logging, normalize, virtualFs } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { HostTree, SchematicContext, callRule } from '@angular-devkit/schematics';
import fsExtra from 'fs-extra';
import inquirer from 'inquirer';
import { firstValueFrom } from 'rxjs';
import { commandHost } from '../duplicatePackages/index.js';
import {
  AppHostingBackend, DeployOptions, FEATURES, FirebaseApp, FirebaseHostingSite, FirebaseProject, FirebaseTools,
} from '../interfaces.js';
import { NEW_OPTION } from './prompts.js';
import { ngAddSetupProject } from './index.js';
import 'jasmine';

/*
 * These specs run the whole `ng add` setup function. Nothing reaches Firebase: firebase-tools is
 * the stand-in built by `newFirebaseTools`, and the user's answers come from `answers`. Each
 * spec runs in its own temporary workspace folder, because the setup reads and writes
 * firebase.json and .firebaserc on disk.
 */

const PROJECT_ID = 'my-project';
const account = { email: 'someone@example.com' };

const projectNamed = (projectId: string): FirebaseProject => ({
  projectId,
  projectNumber: '1',
  displayName: projectId,
  name: `projects/${projectId}`,
  resources: {},
  state: 'ACTIVE',
});

const webApp: FirebaseApp = {
  name: `projects/${PROJECT_ID}/webApps/1:1:web:abc`,
  displayName: 'Web app',
  platform: 'WEB',
  appId: '1:1:web:abc',
  namespace: '',
};

const siteNamed = (siteId: string, type = 'USER_SITE'): FirebaseHostingSite => ({
  name: `projects/${PROJECT_ID}/sites/${siteId}`,
  defaultUrl: `https://${siteId}.web.app`,
  type,
  appId: undefined,
});

/** A backend as firebase-tools lists it. `repository` makes it one that deploys from GitHub. */
const backendNamed = (backendId: string, repository?: string): AppHostingBackend => {
  const backend: AppHostingBackend = { name: `projects/${PROJECT_ID}/locations/us-central1/backends/${backendId}` };
  if (repository) { backend.codebase = { repository }; }
  return backend;
};

/** The build options of a client-rendered app, and of an app that renders pages on a server. */
const clientRendered = { browser: 'src/main.ts' };
const serverRendered = { browser: 'src/main.ts', outputMode: 'server', server: 'src/main.server.ts', ssr: { entry: 'src/server.ts' } };

const deployQuestionChoices = [
  { name: 'Firebase App Hosting (server-side rendering)', value: 'apphosting' },
  { name: 'Firebase Hosting (static and client-rendered apps)', value: 'hosting' },
  { name: "Don't set up deployment", value: 'none' },
];

/** One question as the setup hands it to inquirer. */
interface AskedQuestion {
  name: string;
  type?: string;
  message?: string;
  default?: unknown;
  choices?: unknown[];
  validate?: (input: string) => unknown;
}

const isAskedQuestion = (value: unknown): value is AskedQuestion =>
  typeof value === 'object' && value !== null && 'name' in value;

const isChoiceWithValue = (choice: unknown): choice is { name?: string, value: unknown } =>
  typeof choice === 'object' && choice !== null && 'value' in choice;

/** The answers a list question offers. A choice is a plain value, or an object that carries one as `value`. */
const valuesOffered = (question: AskedQuestion): unknown[] =>
  (question.choices ?? []).map(choice => isChoiceWithValue(choice) ? choice.value : choice);

/** The label of each choice of a list question, as the user reads it. */
const labelsOffered = (question: AskedQuestion | undefined): unknown[] =>
  (question?.choices ?? []).map(choice => isChoiceWithValue(choice) ? choice.name : choice);

/** What the user answers to a question: a fixed answer, or a function of the question. */
type Answer = unknown | ((question: AskedQuestion) => unknown);

/**
 * Accepts whatever the cursor starts on, which is what pressing Enter does. A list question with
 * no starting answer starts on its first choice.
 */
const pressEnter = (question: AskedQuestion): unknown => {
  if (question.default !== undefined || question.type !== 'list') { return question.default; }
  return valuesOffered(question)[0];
};

describe('ng add setup: deployment', () => {
  /** The temporary workspace folder of the spec. */
  let root: string;
  let context: SchematicContext;

  /**
   * What the stand-in firebase-tools reports for the Firebase project. Specs change these before
   * running. The default site is listed second, so that "the default site" and "the first site
   * listed" are different sites.
   */
  let projects: FirebaseProject[];
  let secondSite: FirebaseHostingSite;
  let defaultSite: FirebaseHostingSite;
  let sites: FirebaseHostingSite[];
  let backends: AppHostingBackend[];
  let firebaseTools: FirebaseTools;

  /** The App Hosting backend commands of the stand-in firebase-tools, kept apart so specs can spy on them. */
  let backendCommands: NonNullable<FirebaseTools['apphosting']>['backends'];

  /** The user's answer for each question, by the question's name. A question not listed gets Enter. */
  let answers: Record<string, Answer>;

  /** Every question asked, in order, and every line logged. */
  let asked: AskedQuestion[];
  let logged: { level: string, message: string }[];

  const newFirebaseTools = (): FirebaseTools => {
    const login = Object.assign(() => Promise.resolve(account), {
      list: () => Promise.resolve([{ user: account }]),
      add: () => Promise.resolve(account),
      use: () => Promise.resolve(account.email),
    });
    return {
      cli: { version: () => '15.28.1' },
      login,
      projects: {
        list: () => Promise.resolve(projects),
        create: () => Promise.reject(new Error('not expected in these specs')),
      },
      apps: {
        list: () => Promise.resolve([webApp]),
        create: () => Promise.reject(new Error('not expected in these specs')),
        sdkconfig: () => Promise.resolve({ fileName: '_', fileContents: '', sdkConfig: {} }),
      },
      hosting: {
        sites: {
          list: () => Promise.resolve({ sites }),
          create: (siteId: string) => Promise.resolve(siteNamed(siteId)),
        },
      },
      apphosting: { backends: backendCommands },
      init: () => Promise.resolve(),
      deploy: () => Promise.resolve(),
      use: () => Promise.resolve(),
      serve: () => Promise.resolve(),
      logger: { add: () => undefined, logger: { add: () => undefined } },
    };
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'angularfire-test-'));

    projects = [projectNamed(PROJECT_ID), projectNamed('other-project')];
    secondSite = siteNamed('second-site');
    defaultSite = siteNamed(PROJECT_ID, 'DEFAULT_SITE');
    sites = [secondSite, defaultSite];
    backends = [];
    backendCommands = {
      list: () => Promise.resolve(backends),
      create: () => Promise.resolve({}),
      get: () => Promise.resolve(undefined),
    };
    firebaseTools = newFirebaseTools();
    globalThis.firebaseTools = firebaseTools;

    asked = [];
    answers = { features: [], user: account, projectId: PROJECT_ID, appId: webApp.appId };
    const answerAsTheUser = (question: unknown) => {
      if (!isAskedQuestion(question)) { throw new Error('The setup asked something that is not one question'); }
      asked.push(question);
      const answer = question.name in answers ? answers[question.name] : pressEnter;
      const given: unknown = typeof answer === 'function' ? answer(question) : answer;

      // A user can only pick what a list shows, so an answer that is not among the choices fails the spec.
      if (question.type === 'list' && !valuesOffered(question).includes(given)) {
        throw new Error(`The answer to the question "${question.name}" is not one of its choices`);
      }
      return Promise.resolve({ [question.name]: given });
    };

    // The cast is for inquirer's second, callback-taking form of `prompt`, which the setup never uses.
    spyOn(inquirer, 'prompt').and.callFake(answerAsTheUser as unknown as typeof inquirer.prompt);

    // The duplicate-package check would start the package manager in the temporary folder.
    spyOn(commandHost, 'run').and.returnValue({ stdout: '', status: 0, failure: undefined });

    logged = [];
    const logger = new logging.Logger('test');
    logger.subscribe(entry => { logged.push({ level: entry.level, message: entry.message }); });
    context = { logger } as unknown as SchematicContext;
  });

  afterEach(() => {
    globalThis.firebaseTools = undefined;
    fsExtra.removeSync(root);
  });

  const writeInWorkspace = (fileName: string, content: unknown) =>
    writeFileSync(join(root, fileName), JSON.stringify(content));

  const readFromWorkspace = (fileName: string) => JSON.parse(readFileSync(join(root, fileName)).toString());

  /** Writes angular.json with the application `app`, and `deployEntry` as its deploy entry when given. */
  const writeAngularJson = (
    buildOptions: Record<string, unknown>,
    deployEntry?: Record<string, unknown>,
    otherProjects: Record<string, unknown> = {},
  ) => {
    const architect: Record<string, unknown> = { build: { builder: '@angular/build:application', options: buildOptions } };
    if (deployEntry) { architect.deploy = deployEntry; }
    const app = { root: '', projectType: 'application', architect };
    writeInWorkspace('angular.json', { version: 1, projects: { app, ...otherProjects } });
  };

  const newTree = () => new HostTree(new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(root)));

  /** Runs the setup for the application `app` and returns the tree, which holds the new angular.json. */
  const runSetup = async (options: DeployOptions = { project: 'app' }): Promise<HostTree> => {
    const tree = newTree();
    const rule = await ngAddSetupProject(options)(tree, context);
    if (rule) { await firstValueFrom(callRule(rule, tree, context)); }
    return tree;
  };

  /**
   * Runs the setup with a feature selected, up to the point where it hands back its edits to the
   * app's own files, and does not make those edits. They need the app's source files, which the
   * temporary workspace does not have.
   */
  const runSetupWithAFeature = async (options: DeployOptions = { project: 'app' }): Promise<void> => {
    answers.features = [FEATURES.Authentication];
    await ngAddSetupProject(options)(newTree(), context);
  };

  const deployEntryIn = (tree: HostTree) => JSON.parse(tree.readText('/angular.json')).projects.app.architect.deploy;

  /** The question with the name `name`, as it was asked. */
  const question = (name: string): AskedQuestion | undefined => asked.find(candidate => candidate.name === name);

  const askedNames = () => asked.map(candidate => candidate.name);

  /** Everything logged at `level`, as one text. */
  const logAt = (level: string) => logged.filter(entry => entry.level === level).map(entry => entry.message).join('\n');

  const defaultHostingEntry = (clientSidePage: string) => ({
    target: 'app',
    public: 'dist/app/browser',
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    rewrites: [{ source: '**', destination: `/${clientSidePage}` }],
  });

  const angularFireDeployEntry = (options: Record<string, unknown>) => ({ builder: '@angular/fire:deploy', options });

  describe('with no deployment', () => {

    it('and no features, says there is nothing to do, asks nothing about Firebase and writes nothing', async () => {
      writeAngularJson(clientRendered);
      const listProjects = spyOn(firebaseTools.projects, 'list').and.callThrough();

      const tree = await runSetup({ project: 'app', deploy: 'none' });

      expect(askedNames()).toEqual(['features']);
      expect(logAt('warn')).toContain('so there is nothing to do');
      expect(listProjects).not.toHaveBeenCalled();
      expect(existsSync(join(root, 'firebase.json'))).toBeFalse();
      expect(existsSync(join(root, '.firebaserc'))).toBeFalse();
      expect(deployEntryIn(tree)).toBeUndefined();
    });

    it('and a feature, sets the feature up: asks for the project and the web app, and nothing about deployment', async () => {
      writeAngularJson(serverRendered);
      answers.deploy = 'none';
      const listBackends = spyOn(backendCommands, 'list').and.callThrough();
      const listSites = spyOn(firebaseTools.hosting.sites, 'list').and.callThrough();

      await runSetupWithAFeature();

      expect(askedNames()).toEqual(['features', 'deploy', 'user', 'projectId', 'appId']);
      expect(logAt('warn')).not.toContain('so there is nothing to do');
      expect(logAt('info')).not.toContain('No features were selected');
      expect(listBackends).not.toHaveBeenCalled();
      expect(listSites).not.toHaveBeenCalled();
      expect(readFromWorkspace('firebase.json')).toEqual({});
      expect(readFromWorkspace('.firebaserc')).toEqual({ projects: { default: PROJECT_ID } });
    });

    it('does not ask about the deploy entry of another tool', async () => {
      const otherEntry = { builder: 'angular-cli-ghpages:deploy', options: { baseHref: '/app/' } };
      writeAngularJson(clientRendered, otherEntry);
      answers.deploy = 'none';
      await runSetup();
      expect(askedNames()).toEqual(['features', 'deploy']);
    });

  });

  describe('the deploy question', () => {

    it('offers App Hosting, Hosting and no deployment, each under its own label', async () => {
      writeAngularJson(clientRendered);
      await runSetup();
      expect(question('deploy')?.choices).toEqual(deployQuestionChoices);
    });

    it('starts on Firebase Hosting for a client-rendered app with no deploy setup', async () => {
      writeAngularJson(clientRendered);
      await runSetup();
      expect(question('deploy')?.default).toBe('hosting');
    });

    it('starts on Firebase App Hosting for a server-rendered app with no deploy setup', async () => {
      writeAngularJson(serverRendered);
      await runSetup();
      expect(question('deploy')?.default).toBe('apphosting');
    });

    it('starts on Firebase App Hosting for an app that renders on a server only in its production configuration', async () => {
      const build = {
        builder: '@angular/build:application',
        options: clientRendered,
        configurations: { production: serverRendered },
      };
      const app = { root: '', projectType: 'application', architect: { build } };
      writeInWorkspace('angular.json', { version: 1, projects: { app } });
      answers.deploy = 'hosting';

      await runSetup();

      expect(question('deploy')?.default).toBe('apphosting');
      expect(logAt('warn')).toContain('which Firebase Hosting cannot run');
    });

    it('starts on what the project already deploys with, whatever kind of app it is', async () => {
      writeAngularJson(serverRendered, angularFireDeployEntry({ version: 2 }));
      await runSetup();
      expect(question('deploy')?.default).toBe('hosting');
    });

    it('is not asked when the deploy option is given', async () => {
      writeAngularJson(serverRendered);
      const tree = await runSetup({ project: 'app', deploy: 'hosting' });
      expect(question('deploy')).toBeUndefined();
      expect(deployEntryIn(tree).options).toEqual({ version: 2 });
    });

    it('asks before replacing the deploy entry of another tool, and keeps it on a no', async () => {
      const otherEntry = { builder: 'angular-cli-ghpages:deploy', options: { baseHref: '/app/' } };
      writeAngularJson(clientRendered, otherEntry);
      answers.deploy = 'hosting';
      answers.confirmed = false;

      const tree = await runSetup();

      expect(question('confirmed')?.message).toContain('already deploys with angular-cli-ghpages:deploy');
      expect(logAt('info')).toContain('Keeping the existing deploy target. Deployment was not set up.');
      expect(deployEntryIn(tree)).toEqual(otherEntry);
      expect(existsSync(join(root, 'firebase.json'))).toBeFalse();
    });

    it('replaces the deploy entry of another tool on a yes', async () => {
      writeAngularJson(clientRendered, { builder: 'angular-cli-ghpages:deploy', options: { baseHref: '/app/' } });
      answers.deploy = 'hosting';
      answers.confirmed = true;

      const tree = await runSetup();

      expect(deployEntryIn(tree)).toEqual(angularFireDeployEntry({ version: 2 }));
    });

  });

  describe('Firebase Hosting', () => {

    it('sets up a client-rendered app: the three files, and no question about a web app', async () => {
      writeAngularJson(clientRendered);
      const listSites = spyOn(firebaseTools.hosting.sites, 'list').and.callThrough();

      const tree = await runSetup();

      expect(askedNames()).toEqual(['features', 'deploy', 'user', 'projectId', 'site']);
      expect(listSites).toHaveBeenCalledOnceWith(jasmine.objectContaining({ project: PROJECT_ID }));
      expect(readFromWorkspace('.firebaserc')).toEqual({
        projects: { default: PROJECT_ID },
        targets: { [PROJECT_ID]: { hosting: { app: [PROJECT_ID] } } },
      });
      expect(readFromWorkspace('firebase.json')).toEqual({ hosting: [defaultHostingEntry('index.html')] });
      expect(deployEntryIn(tree)).toEqual(angularFireDeployEntry({ version: 2 }));
      expect(logAt('info')).toContain('Deployment is set up. Run ng deploy to deploy your app.');
      expect(logAt('info')).toContain('No features were selected, so only deployment is being set up.');
    });

    it('prints none of the notes meant for other setups', async () => {
      writeAngularJson(clientRendered);

      await runSetup();

      expect(logAt('warn')).not.toContain('which Firebase Hosting cannot run');
      expect(logAt('warn')).not.toContain('built once per locale');
      expect(logAt('warn')).not.toContain('ng deploy still deploys this app');
      expect(logAt('info')).not.toContain('Firebase App Hosting needs');
    });

    it('asks for the web app as well when a feature is selected', async () => {
      writeAngularJson(clientRendered);
      const sdkConfig = spyOn(firebaseTools.apps, 'sdkconfig').and.callThrough();

      await runSetupWithAFeature();

      expect(askedNames()).toEqual(['features', 'deploy', 'user', 'projectId', 'appId', 'site']);
      expect(sdkConfig).toHaveBeenCalledOnceWith('web', webApp.appId, jasmine.anything());
      expect(logAt('info')).not.toContain('No features were selected');
    });

    it('works with a firebase-tools that is too old for App Hosting', async () => {
      writeAngularJson(clientRendered);
      firebaseTools.cli = { version: () => '15.8.0' };
      const tree = await runSetup();
      expect(deployEntryIn(tree)).toEqual(angularFireDeployEntry({ version: 2 }));
    });

    it('warns that Hosting cannot run a server, and serves the client-side page of a server-rendered build', async () => {
      writeAngularJson(serverRendered);
      answers.deploy = 'hosting';

      await runSetup();

      expect(logAt('warn')).toContain('which Firebase Hosting cannot run');
      expect(readFromWorkspace('firebase.json')).toEqual({ hosting: [defaultHostingEntry('index.csr.html')] });
    });

    it('warns about a build that is localized', async () => {
      writeAngularJson({ ...clientRendered, localize: true });
      await runSetup();
      expect(logAt('warn')).toContain('built once per locale');
    });

    it('starts the site question on the default site of the project, and offers creating one', async () => {
      writeAngularJson(clientRendered);

      await runSetup();

      expect(question('site')?.default).toBe(defaultSite);
      expect(labelsOffered(question('site'))).toEqual([
        'second-site (https://second-site.web.app)',
        `${PROJECT_ID} (https://${PROJECT_ID}.web.app)`,
        '[CREATE NEW SITE]',
      ]);
    });

    it('starts the site question on the site the app already deploys to, without marking it as used', async () => {
      writeAngularJson(clientRendered, angularFireDeployEntry({ version: 2 }));
      writeInWorkspace('.firebaserc', {
        projects: { default: PROJECT_ID },
        targets: { [PROJECT_ID]: { hosting: { app: ['second-site'] } } },
      });

      await runSetup();

      expect(question('site')?.default).toBe(secondSite);
      expect(labelsOffered(question('site'))[0]).toBe('second-site (https://second-site.web.app)');
    });

    it('starts the project and site questions on what the app deploys to, when that is not the default project', async () => {
      writeAngularJson(clientRendered, angularFireDeployEntry({ version: 2 }));
      writeInWorkspace('.firebaserc', {
        projects: { default: PROJECT_ID },
        targets: { 'other-project': { hosting: { app: ['second-site'] } } },
      });
      answers.projectId = pressEnter;

      await runSetup();

      expect(question('projectId')?.default).toBe('other-project');
      expect(question('site')?.default).toBe(secondSite);
    });

    it('marks a site that another target name deploys to, and does not start on it', async () => {
      writeAngularJson(clientRendered);
      writeInWorkspace('.firebaserc', {
        projects: { default: PROJECT_ID },
        targets: { [PROJECT_ID]: { hosting: { admin: [PROJECT_ID] } } },
      });

      await runSetup();

      expect(labelsOffered(question('site'))[1]).toBe(`${PROJECT_ID} (https://${PROJECT_ID}.web.app) [used by admin]`);
      expect(question('site')?.default).toBe(secondSite);
    });

    it('starts on creating a site when another target name deploys to every site of the project', async () => {
      writeAngularJson(clientRendered);
      sites = [defaultSite];
      writeInWorkspace('.firebaserc', {
        projects: { default: PROJECT_ID },
        targets: { [PROJECT_ID]: { hosting: { admin: [PROJECT_ID] } } },
      });
      answers.siteId = 'app-site';

      await runSetup();

      expect(question('site')?.default).toBe(NEW_OPTION);
      expect(readFromWorkspace('.firebaserc').targets[PROJECT_ID].hosting).toEqual({ admin: [PROJECT_ID], app: ['app-site'] });
    });

    it('creates the site the user asks for and deploys to it', async () => {
      writeAngularJson(clientRendered);
      answers.site = NEW_OPTION;
      answers.siteId = 'brand-new-site';
      const createSite = spyOn(firebaseTools.hosting.sites, 'create').and.callThrough();

      await runSetup();

      expect(createSite).toHaveBeenCalledOnceWith('brand-new-site', jasmine.objectContaining({ project: PROJECT_ID }));
      expect(readFromWorkspace('.firebaserc').targets[PROJECT_ID].hosting.app).toEqual(['brand-new-site']);
      expect(question('siteId')?.validate?.('   ')).toBe('Please provide a site id.');
      expect(question('siteId')?.validate?.('brand-new-site')).toBeTrue();
    });

    it('asks for the id of the first site of a project that has none, suggesting the project id', async () => {
      writeAngularJson(clientRendered);
      sites = [];
      answers.siteId = 'first-site';
      const createSite = spyOn(firebaseTools.hosting.sites, 'create').and.callThrough();

      await runSetup();

      expect(question('site')).toBeUndefined();
      expect(question('siteId')?.default).toBe(PROJECT_ID);
      expect(createSite).toHaveBeenCalledOnceWith('first-site', jasmine.objectContaining({ project: PROJECT_ID }));
    });

    it('changes nothing on a second run where the user presses Enter at every question', async () => {
      writeAngularJson(clientRendered);
      answers.site = secondSite;
      const firstTree = await runSetup();
      const firebaseJsonAfterFirstRun = readFromWorkspace('firebase.json');
      const firebaseRcAfterFirstRun = readFromWorkspace('.firebaserc');
      writeAngularJson(clientRendered, deployEntryIn(firstTree));

      delete answers.site;
      answers.projectId = pressEnter;
      asked = [];
      const secondTree = await runSetup();

      expect(question('deploy')?.default).toBe('hosting');
      expect(question('projectId')?.default).toBe(PROJECT_ID);
      expect(question('site')?.default).toBe(secondSite);
      expect(readFromWorkspace('firebase.json')).toEqual(firebaseJsonAfterFirstRun);
      expect(readFromWorkspace('.firebaserc')).toEqual(firebaseRcAfterFirstRun);
      expect(deployEntryIn(secondTree)).toEqual(deployEntryIn(firstTree));
    });

    it('writes the firebaseProject option when the target name ends up under two Firebase projects', async () => {
      writeAngularJson(clientRendered);
      writeInWorkspace('.firebaserc', {
        projects: { default: 'other-project' },
        targets: { 'other-project': { hosting: { app: ['other-site'] } } },
      });

      const tree = await runSetup();

      expect(deployEntryIn(tree).options).toEqual({ version: 2, firebaseProject: PROJECT_ID });
      expect(readFromWorkspace('.firebaserc').targets['other-project']).toEqual({ hosting: { app: ['other-site'] } });
    });

    describe('with a lone Hosting entry that has no target name in firebase.json', () => {
      const unnamedEntry = { public: 'public', headers: [{ source: '**', headers: [] }] };

      beforeEach(() => {
        writeAngularJson(clientRendered);
        writeInWorkspace('firebase.json', { hosting: unnamedEntry });
      });

      it('asks right after the deploy question whether to use that entry', async () => {
        answers.confirmed = true;
        await runSetup();
        expect(askedNames().slice(0, 3)).toEqual(['features', 'deploy', 'confirmed']);
        expect(question('confirmed')?.message).toContain('has a Hosting entry with no target name (it serves "public")');
      });

      it('turns that entry into the entry of the app on a yes', async () => {
        answers.confirmed = true;
        await runSetup();
        const hostingEntries = readFromWorkspace('firebase.json').hosting;
        expect(hostingEntries.length).toBe(1);
        expect(hostingEntries[0]).toEqual(jasmine.objectContaining({
          target: 'app',
          public: 'dist/app/browser',
          headers: unnamedEntry.headers,
        }));
      });

      it('leaves firebase.json alone, sets up no deployment and says how to go on, on a no', async () => {
        answers.confirmed = false;
        const tree = await runSetup();
        expect(readFromWorkspace('firebase.json')).toEqual({ hosting: unnamedEntry });
        expect(deployEntryIn(tree)).toBeUndefined();
        expect(logAt('info')).toContain('Deployment was not set up.');
        expect(logAt('info')).toContain('firebase target:apply hosting <name> <site id>');
        expect(question('site')).toBeUndefined();
      });

      it('does not ask about that entry when the user chooses App Hosting', async () => {
        writeAngularJson(serverRendered);
        const tree = await runSetup();
        expect(question('confirmed')).toBeUndefined();
        expect(deployEntryIn(tree).options.appHostingBackend).toBe('app');
        expect(readFromWorkspace('firebase.json').hosting).toEqual(unnamedEntry);
      });

    });

  });

  describe('Firebase App Hosting', () => {

    beforeEach(() => {
      writeAngularJson(serverRendered);
    });

    it('sets up a server-rendered app: creates the backend the user describes and writes the three files', async () => {
      answers.backendId = 'web-frontend';
      const listBackends = spyOn(backendCommands, 'list').and.callThrough();
      const createBackend = spyOn(backendCommands, 'create').and.callThrough();
      const callOptions = { project: PROJECT_ID, projectRoot: root, account: account.email, nonInteractive: true };

      const tree = await runSetup();

      expect(askedNames()).toEqual(['features', 'deploy', 'user', 'projectId', 'appId', 'backendId', 'region']);
      expect(listBackends).toHaveBeenCalledOnceWith(callOptions);
      expect(createBackend).toHaveBeenCalledOnceWith({
        ...callOptions,
        backend: 'web-frontend',
        primaryRegion: 'us-east4',
        rootDir: '.',
        app: webApp.appId,
      });
      expect(readFromWorkspace('firebase.json')).toEqual({
        apphosting: {
          backendId: 'web-frontend',
          rootDir: '.',
          ignore: ['node_modules', '.git', '/dist', '.angular', 'firebase-debug.log'],
        },
      });
      expect(readFromWorkspace('.firebaserc')).toEqual({ projects: { default: PROJECT_ID } });
      expect(deployEntryIn(tree)).toEqual(angularFireDeployEntry({ version: 2, appHostingBackend: 'web-frontend' }));
      expect(logAt('warn')).not.toContain('ng deploy still deploys this app');
    });

    it('says what App Hosting needs of the chosen Firebase project', async () => {
      await runSetup();
      expect(logAt('info')).toContain('Firebase App Hosting needs the Blaze pricing plan');
      expect(logAt('info')).toContain(`https://console.firebase.google.com/project/${PROJECT_ID}/usage/details`);
    });

    it('suggests the project name as the id of a new backend and us-east4 as its region', async () => {
      await runSetup();
      expect(question('backendId')?.default).toBe('app');
      expect(question('region')?.default).toBe('us-east4');
    });

    it('refuses a backend id the project already uses, and one App Hosting would reject', async () => {
      backends = [backendNamed('taken-backend')];
      answers.backend = NEW_OPTION;

      await runSetup();

      const validate = question('backendId')?.validate;
      expect(validate?.('taken-backend')).toBe('This project already has a backend named taken-backend.');
      expect(validate?.('My_Backend')).toMatch(/^Use 3 to 30 lowercase letters, numbers and hyphens/);
      expect(validate?.('free-backend')).toBeTrue();
    });

    it('creates the backend in a region the user types', async () => {
      answers.region = NEW_OPTION;
      answers.typedRegion = 'europe-west9';
      const createBackend = spyOn(backendCommands, 'create').and.callThrough();

      await runSetup();

      expect(createBackend.calls.mostRecent().args[0].primaryRegion).toBe('europe-west9');
      expect(question('typedRegion')?.validate?.('europe-west9')).toBeTrue();
      expect(question('typedRegion')?.validate?.('Iowa')).toBe('A region id looks like us-central1.');
    });

    it('starts the backend question on creating one, not on a backend of another app', async () => {
      backends = [backendNamed('another-app')];
      await runSetup();
      expect(question('backend')?.default).toBe(NEW_OPTION);
      expect(labelsOffered(question('backend'))).toEqual(['another-app', '[CREATE NEW BACKEND]']);
    });

    it('starts the backend question on the backend the app already deploys to, and sets it up again without creating one', async () => {
      writeAngularJson(serverRendered, angularFireDeployEntry({ version: 2, appHostingBackend: 'mine' }));
      backends = [backendNamed('another-app'), backendNamed('mine')];
      const createBackend = spyOn(backendCommands, 'create').and.callThrough();

      const tree = await runSetup();

      expect(question('deploy')?.default).toBe('apphosting');
      expect(question('backend')?.default).toBe(backends[1]);
      expect(question('confirmed')).toBeUndefined();
      expect(createBackend).not.toHaveBeenCalled();
      expect(readFromWorkspace('firebase.json').apphosting).toEqual(jasmine.objectContaining({ backendId: 'mine' }));
      expect(readFromWorkspace('firebase.json').apphosting.alwaysDeployFromSource).toBeUndefined();
      expect(deployEntryIn(tree).options).toEqual({ version: 2, appHostingBackend: 'mine' });
      expect(logAt('info')).toContain('Deployment is set up. Run ng deploy to deploy your app.');
    });

    it('writes the newly chosen Firebase project as the default when an App Hosting app is set up again', async () => {
      writeAngularJson(serverRendered, angularFireDeployEntry({ version: 2, appHostingBackend: 'mine' }));
      writeInWorkspace('.firebaserc', { projects: { default: 'other-project' } });
      backends = [backendNamed('mine')];

      await runSetup();

      expect(readFromWorkspace('.firebaserc').projects.default).toBe(PROJECT_ID);
      expect(logAt('warn')).not.toContain('ng deploy still deploys this app');
    });

    it('stops before any question about Firebase when firebase-tools is too old for App Hosting', async () => {
      firebaseTools.cli = { version: () => '15.8.0' };
      const listProjects = spyOn(firebaseTools.projects, 'list').and.callThrough();

      await expectAsync(runSetup()).toBeRejectedWithError(/Setting up App Hosting needs firebase-tools 15\.9\.0 or newer/);

      expect(askedNames()).toEqual(['features', 'deploy']);
      expect(listProjects).not.toHaveBeenCalled();
      expect(existsSync(join(root, 'firebase.json'))).toBeFalse();
    });

    it('says to check the build script when the workspace has a second application', async () => {
      const admin = { root: 'projects/admin', projectType: 'application', architect: {} };
      writeAngularJson(serverRendered, undefined, { admin });
      await runSetup();
      expect(logAt('warn')).toContain('make sure the build script in package.json builds "app"');
    });

    it('does not say that for a workspace whose other project is a library', async () => {
      const library = { root: 'projects/ui', projectType: 'library', architect: {} };
      writeAngularJson(serverRendered, undefined, { library });
      await runSetup();
      expect(logAt('warn')).not.toContain('make sure the build script');
    });

    describe('with a backend that deploys from GitHub', () => {

      beforeEach(() => {
        backends = [backendNamed('from-github', 'my-org-my-repo')];
        answers.backend = backends[0];
      });

      it('says so in the list of backends', async () => {
        await runSetup();
        expect(labelsOffered(question('backend'))).toEqual(['from-github (deploys from GitHub today)', '[CREATE NEW BACKEND]']);
      });

      it('asks before deploying local files to it, and records a yes for firebase-tools', async () => {
        answers.confirmed = true;
        const tree = await runSetup();
        expect(question('confirmed')?.message).toContain('from-github deploys from a GitHub repository today');
        expect(readFromWorkspace('firebase.json').apphosting.alwaysDeployFromSource).toBeTrue();
        expect(deployEntryIn(tree).options.appHostingBackend).toBe('from-github');
      });

      it('sets up no deployment on a no', async () => {
        answers.confirmed = false;
        const tree = await runSetup();
        expect(deployEntryIn(tree)).toBeUndefined();
        expect(readFromWorkspace('firebase.json').apphosting).toBeUndefined();
        expect(logAt('info')).toContain('Deployment was not set up.');
      });

      it('does not ask again on a later run, once firebase.json records the yes', async () => {
        writeInWorkspace('firebase.json', { apphosting: { backendId: 'from-github', alwaysDeployFromSource: true } });
        const tree = await runSetup();
        expect(question('confirmed')).toBeUndefined();
        expect(deployEntryIn(tree).options.appHostingBackend).toBe('from-github');
      });

    });

    describe('when the list of backends cannot be read', () => {

      beforeEach(() => {
        spyOn(backendCommands, 'list').and.rejectWith(new Error('billing is not enabled'));
      });

      it('says why deployment was not set up, and what App Hosting needs', async () => {
        await runSetup();
        expect(logAt('warn')).toContain(`Deployment was not set up: Could not list App Hosting backends for project ${PROJECT_ID}: billing is not enabled`);
        expect(logAt('warn')).toContain('Firebase App Hosting needs the Blaze pricing plan');
        expect(logAt('warn')).toContain('Run ng add @angular/fire again to set up deployment.');
      });

      it('finishes the run with the chosen project written as default and no deploy entry', async () => {
        writeInWorkspace('.firebaserc', { projects: { default: 'other-project' } });
        const tree = await runSetup();
        expect(readFromWorkspace('.firebaserc')).toEqual({ projects: { default: PROJECT_ID } });
        expect(deployEntryIn(tree)).toBeUndefined();
        expect(logAt('warn')).not.toContain('ng deploy still deploys this app');
      });

    });

    describe('when the backend cannot be created', () => {

      beforeEach(() => {
        spyOn(backendCommands, 'create').and.rejectWith(new Error('billing is not enabled'));
      });

      it('says why deployment was not set up, and what App Hosting needs', async () => {
        await runSetup();
        expect(logAt('warn')).toContain(`Deployment was not set up: Could not create the App Hosting backend app for project ${PROJECT_ID}: billing is not enabled`);
        expect(logAt('warn')).toContain('Firebase App Hosting needs the Blaze pricing plan');
      });

      it('writes no deploy setup for the backend that does not exist', async () => {
        const tree = await runSetup();
        expect(deployEntryIn(tree)).toBeUndefined();
        expect(readFromWorkspace('firebase.json')).toEqual({});
        expect(logAt('info')).not.toContain('Deployment is set up.');
      });

    });

    describe('when an app that deploys to App Hosting gets no deployment set up in this run', () => {

      beforeEach(() => {
        writeAngularJson(serverRendered, angularFireDeployEntry({ version: 2, appHostingBackend: 'from-github' }));
        writeInWorkspace('.firebaserc', { projects: { default: 'other-project' } });
        backends = [backendNamed('from-github', 'my-org-my-repo')];
        answers.confirmed = false;
      });

      it('keeps the default project the app deploys to, and says so when another project was chosen', async () => {
        await runSetup();
        expect(readFromWorkspace('.firebaserc').projects.default).toBe('other-project');
        expect(logAt('warn')).toContain('ng deploy still deploys this app to the Firebase project other-project');
      });

      it('says nothing about it when the same project was chosen', async () => {
        answers.projectId = 'other-project';
        await runSetup();
        expect(readFromWorkspace('.firebaserc').projects.default).toBe('other-project');
        expect(logAt('warn')).not.toContain('ng deploy still deploys this app');
      });

    });

  });

});
