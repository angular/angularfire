import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { logging } from '@angular-devkit/core';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import fsExtra from 'fs-extra';
import { BuildTargetDefinition } from '../buildOptions.js';
import { FirebaseRc } from '../interfaces.js';
import {
  alreadyDeploysLocalFiles,
  backendIdFromProjectName,
  deployBuilder,
  existingAppHostingBackend,
  existingDeployChoice,
  existingFirebaseProject,
  firebaseProjectForDeployOption,
  firebaseRcForSetup,
  isValidBackendId,
  setAppHostingInFirebaseJson,
  setDeployTarget,
  setHostingInFirebaseJson,
  setHostingTargetInFirebaseRc,
  unnamedHostingEntryToReplace,
} from './deployConfigs.js';
import 'jasmine';

const context = { logger: new logging.Logger('test') } as unknown as SchematicContext;

/** A `deploy` entry as `ng add` writes it for Firebase Hosting. */
const hostingDeployEntry: BuildTargetDefinition = { builder: deployBuilder, options: { version: 2 } };

/** A `deploy` entry as `ng add` writes it for Firebase App Hosting. */
const appHostingDeployEntry: BuildTargetDefinition = {
  builder: deployBuilder,
  options: { version: 2, appHostingBackend: 'my-backend' },
};

/** A `deploy` entry that belongs to another tool. */
const otherToolDeployEntry: BuildTargetDefinition = {
  builder: 'angular-cli-ghpages:deploy',
  options: { appHostingBackend: 'not-ours', firebaseProject: 'not-ours' },
};

describe('existingAppHostingBackend', () => {

  it('is the backend of an AngularFire deploy entry for App Hosting', () => {
    expect(existingAppHostingBackend(appHostingDeployEntry)).toBe('my-backend');
  });

  it('is undefined for an AngularFire deploy entry for Hosting', () => {
    expect(existingAppHostingBackend(hostingDeployEntry)).toBeUndefined();
  });

  it('is undefined for the deploy entry of another tool', () => {
    expect(existingAppHostingBackend(otherToolDeployEntry)).toBeUndefined();
  });

  it('is undefined for a project with no deploy entry', () => {
    expect(existingAppHostingBackend(undefined)).toBeUndefined();
  });

});

describe('existingDeployChoice', () => {

  it('is apphosting for a deploy entry with a backend', () => {
    expect(existingDeployChoice(appHostingDeployEntry)).toBe('apphosting');
  });

  it('is hosting for a deploy entry with version 2 and no backend', () => {
    expect(existingDeployChoice(hostingDeployEntry)).toBe('hosting');
  });

  it('is hosting for an AngularFire deploy entry with no options', () => {
    expect(existingDeployChoice({ builder: deployBuilder })).toBe('hosting');
  });

  it('is none for an entry that deploys its server to Cloud Run the older way, with ssr and no version', () => {
    expect(existingDeployChoice({ builder: deployBuilder, options: { ssr: 'cloud-run' } })).toBe('none');
  });

  it('is none for an entry that deploys its server to Cloud Functions the older way', () => {
    expect(existingDeployChoice({ builder: deployBuilder, options: { ssr: true } })).toBe('none');
  });

  it('is hosting for an entry with ssr once it has version 2', () => {
    expect(existingDeployChoice({ builder: deployBuilder, options: { ssr: true, version: 2 } })).toBe('hosting');
  });

  it('is undefined for the deploy entry of another tool', () => {
    expect(existingDeployChoice(otherToolDeployEntry)).toBeUndefined();
  });

  it('is undefined for a project with no deploy entry', () => {
    expect(existingDeployChoice(undefined)).toBeUndefined();
  });

});

describe('existingFirebaseProject', () => {

  /** The target name `my-app` under one project, which is not the default project. */
  const targetUnderOneProject: FirebaseRc = {
    projects: { default: 'default-project' },
    targets: { 'production-project': { hosting: { 'my-app': ['production-site'] } } },
  };

  /** The target name `my-app` under two projects, neither of which is the default project. */
  const targetUnderTwoProjects: FirebaseRc = {
    projects: { default: 'default-project' },
    targets: {
      'staging-project': { hosting: { 'my-app': ['staging-site'] } },
      'production-project': { hosting: { 'my-app': ['production-site'] } },
    },
  };

  it('is the default project for an App Hosting entry, whatever Hosting targets the file has', () => {
    expect(existingFirebaseProject(appHostingDeployEntry, targetUnderOneProject, 'my-app')).toBe('default-project');
  });

  it('is the one project that has the target name', () => {
    expect(existingFirebaseProject(hostingDeployEntry, targetUnderOneProject, 'my-app')).toBe('production-project');
  });

  it('is the firebaseProject option when the target name is under two projects', () => {
    const deployEntry: BuildTargetDefinition = {
      builder: deployBuilder,
      options: { version: 2, firebaseProject: 'production-project' },
    };
    expect(existingFirebaseProject(deployEntry, targetUnderTwoProjects, 'my-app')).toBe('production-project');
  });

  it('is the default project when the target name is under two projects and no option chooses', () => {
    expect(existingFirebaseProject(hostingDeployEntry, targetUnderTwoProjects, 'my-app')).toBe('default-project');
  });

  it('is the default project when the option is a project without the target name', () => {
    const deployEntry: BuildTargetDefinition = {
      builder: deployBuilder,
      options: { version: 2, firebaseProject: 'retired-project' },
    };
    expect(existingFirebaseProject(deployEntry, targetUnderTwoProjects, 'my-app')).toBe('default-project');
  });

  it('ignores the firebaseProject option of another tool', () => {
    const deployEntry: BuildTargetDefinition = {
      builder: 'angular-cli-ghpages:deploy',
      options: { firebaseProject: 'production-project' },
    };
    expect(existingFirebaseProject(deployEntry, targetUnderTwoProjects, 'my-app')).toBe('default-project');
  });

  it('is the first project with the target name when the file has no default project', () => {
    const firebaseRc: FirebaseRc = {
      projects: { staging: 'staging-project', production: 'production-project' },
      targets: targetUnderTwoProjects.targets,
    };
    expect(existingFirebaseProject(hostingDeployEntry, firebaseRc, 'my-app')).toBe('staging-project');
  });

  it('is the default project for a file with no targets', () => {
    const firebaseRc: FirebaseRc = { projects: { default: 'default-project' } };
    expect(existingFirebaseProject(undefined, firebaseRc, 'my-app')).toBe('default-project');
  });

  it('is undefined when there is no .firebaserc content', () => {
    expect(existingFirebaseProject(undefined, {}, 'my-app')).toBeUndefined();
  });

});

describe('the writers of firebase.json and .firebaserc', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'angularfire-test-'));
  });

  afterEach(() => {
    fsExtra.removeSync(projectRoot);
  });

  const writeOnDisk = (fileName: string, content: unknown) =>
    writeFileSync(join(projectRoot, fileName), JSON.stringify(content));

  const readFromDisk = (fileName: string) =>
    JSON.parse(readFileSync(join(projectRoot, fileName)).toString());

  describe('setHostingTargetInFirebaseRc', () => {

    it('creates .firebaserc with the target name under the project', () => {
      setHostingTargetInFirebaseRc(projectRoot, 'my-project', 'my-app', 'my-site');
      expect(readFromDisk('.firebaserc')).toEqual({
        targets: { 'my-project': { hosting: { 'my-app': ['my-site'] } } },
      });
    });

    it('keeps the default project, the other target names, the other kinds of target and the other projects', () => {
      writeOnDisk('.firebaserc', {
        projects: { default: 'my-project' },
        targets: {
          'my-project': { hosting: { admin: ['admin-site'] }, storage: { uploads: ['my-bucket'] } },
          'other-project': { hosting: { 'my-app': ['other-site'] } },
        },
      });
      setHostingTargetInFirebaseRc(projectRoot, 'my-project', 'my-app', 'my-site');
      expect(readFromDisk('.firebaserc')).toEqual({
        projects: { default: 'my-project' },
        targets: {
          'my-project': { hosting: { admin: ['admin-site'], 'my-app': ['my-site'] }, storage: { uploads: ['my-bucket'] } },
          'other-project': { hosting: { 'my-app': ['other-site'] } },
        },
      });
    });

    it('replaces the site the target name had in the project', () => {
      writeOnDisk('.firebaserc', { targets: { 'my-project': { hosting: { 'my-app': ['old-site'] } } } });
      setHostingTargetInFirebaseRc(projectRoot, 'my-project', 'my-app', 'new-site');
      expect(readFromDisk('.firebaserc').targets['my-project'].hosting['my-app']).toEqual(['new-site']);
    });

    it('stops with the path of a .firebaserc that cannot be parsed, and the reason', () => {
      writeFileSync(join(projectRoot, '.firebaserc'), '{ not json');
      expect(() => setHostingTargetInFirebaseRc(projectRoot, 'my-project', 'my-app', 'my-site'))
        .toThrowError(/Error when parsing .*\.firebaserc: .*JSON/);
    });

  });

  describe('firebaseRcForSetup', () => {

    it('reads .firebaserc from the workspace root', () => {
      writeOnDisk('.firebaserc', { projects: { default: 'my-project' } });
      expect(firebaseRcForSetup(projectRoot)).toEqual({ projects: { default: 'my-project' } });
    });

    it('reads a missing file as empty', () => {
      expect(firebaseRcForSetup(projectRoot)).toEqual({});
    });

    it('stops with the path of a file that cannot be parsed', () => {
      writeFileSync(join(projectRoot, '.firebaserc'), '{ not json');
      expect(() => firebaseRcForSetup(projectRoot)).toThrowError(/Error when parsing .*\.firebaserc/);
    });

  });

  describe('firebaseProjectForDeployOption', () => {

    it('is the project when the file has the target name under two projects', () => {
      writeOnDisk('.firebaserc', {
        targets: {
          'staging-project': { hosting: { 'my-app': ['staging-site'] } },
          'production-project': { hosting: { 'my-app': ['production-site'] } },
        },
      });
      expect(firebaseProjectForDeployOption(projectRoot, 'production-project', 'my-app')).toBe('production-project');
    });

    it('is undefined when the file has the target name under one project', () => {
      writeOnDisk('.firebaserc', {
        targets: {
          'staging-project': { hosting: { admin: ['admin-site'] } },
          'production-project': { hosting: { 'my-app': ['production-site'] } },
        },
      });
      expect(firebaseProjectForDeployOption(projectRoot, 'production-project', 'my-app')).toBeUndefined();
    });

    it('is undefined when there is no .firebaserc', () => {
      expect(firebaseProjectForDeployOption(projectRoot, 'production-project', 'my-app')).toBeUndefined();
    });

  });

  describe('unnamedHostingEntryToReplace', () => {

    it('is the lone entry with no target name that firebase init hosting writes', () => {
      writeOnDisk('firebase.json', { hosting: { public: 'public', ignore: ['firebase.json'] } });
      expect(unnamedHostingEntryToReplace(projectRoot, 'my-app')).toEqual({ public: 'public', ignore: ['firebase.json'] });
    });

    it('is the lone entry with no target name when hosting is written as a list', () => {
      writeOnDisk('firebase.json', { hosting: [{ public: 'public' }] });
      expect(unnamedHostingEntryToReplace(projectRoot, 'my-app')).toEqual({ public: 'public' });
    });

    it('is undefined when an entry already has the target name', () => {
      writeOnDisk('firebase.json', { hosting: [{ target: 'my-app', public: 'dist/my-app/browser' }] });
      expect(unnamedHostingEntryToReplace(projectRoot, 'my-app')).toBeUndefined();
    });

    it('is undefined when the entry with the target name comes after the entry of another app', () => {
      writeOnDisk('firebase.json', {
        hosting: [{ target: 'admin', public: 'dist/admin/browser' }, { target: 'my-app', public: 'dist/my-app/browser' }],
      });
      expect(unnamedHostingEntryToReplace(projectRoot, 'my-app')).toBeUndefined();
    });

    it('is undefined when the lone entry has another target name', () => {
      writeOnDisk('firebase.json', { hosting: { target: 'admin', public: 'dist/admin/browser' } });
      expect(unnamedHostingEntryToReplace(projectRoot, 'my-app')).toBeUndefined();
    });

    it('is undefined when the lone entry deploys to a site by its id', () => {
      writeOnDisk('firebase.json', { hosting: { site: 'my-site', public: 'public' } });
      expect(unnamedHostingEntryToReplace(projectRoot, 'my-app')).toBeUndefined();
    });

    it('is undefined when an entry with no target name is one of several', () => {
      writeOnDisk('firebase.json', { hosting: [{ public: 'public' }, { target: 'admin', public: 'dist/admin/browser' }] });
      expect(unnamedHostingEntryToReplace(projectRoot, 'my-app')).toBeUndefined();
    });

    it('is undefined when there is no firebase.json', () => {
      expect(unnamedHostingEntryToReplace(projectRoot, 'my-app')).toBeUndefined();
    });

  });

  describe('setHostingInFirebaseJson', () => {

    it('creates firebase.json with an entry that serves the build and falls back to the client-side page', () => {
      setHostingInFirebaseJson(projectRoot, 'my-app', 'dist/my-app/browser', 'index.html');
      expect(readFromDisk('firebase.json')).toEqual({
        hosting: [{
          target: 'my-app',
          public: 'dist/my-app/browser',
          ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
          rewrites: [{ source: '**', destination: '/index.html' }],
        }],
      });
    });

    it('adds its entry beside the entry of another target name and keeps the other settings of the file', () => {
      const adminEntry = { target: 'admin', public: 'dist/admin/browser' };
      writeOnDisk('firebase.json', { firestore: { rules: 'firestore.rules' }, hosting: adminEntry });
      setHostingInFirebaseJson(projectRoot, 'my-app', 'dist/my-app/browser', 'index.html');
      const firebaseJson = readFromDisk('firebase.json');
      expect(firebaseJson.firestore).toEqual({ rules: 'firestore.rules' });
      expect(firebaseJson.hosting.length).toBe(2);
      expect(firebaseJson.hosting[0]).toEqual(adminEntry);
      expect(firebaseJson.hosting[1].target).toBe('my-app');
    });

    it('rewrites its own entry from an earlier run, keeping what the user added to it', () => {
      writeOnDisk('firebase.json', {
        hosting: [{
          target: 'my-app',
          public: 'dist/old-folder',
          ignore: ['firebase.json', 'drafts/**'],
          headers: [{ source: '**', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }],
          rewrites: [
            { source: '**', destination: '/index.html' },
            { source: '/api/**', destination: '/api.html' },
          ],
        }],
      });
      setHostingInFirebaseJson(projectRoot, 'my-app', 'dist/my-app/browser', 'index.csr.html');
      expect(readFromDisk('firebase.json')).toEqual({
        hosting: [{
          target: 'my-app',
          public: 'dist/my-app/browser',
          ignore: ['firebase.json', 'drafts/**'],
          headers: [{ source: '**', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }],
          rewrites: [
            { source: '/api/**', destination: '/api.html' },
            { source: '**', destination: '/index.csr.html' },
          ],
        }],
      });
    });

    it('rewrites its own entry when it comes after the entry of another app, which it leaves alone', () => {
      const adminEntry = {
        target: 'admin',
        public: 'dist/admin/browser',
        headers: [{ source: '**', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] }],
      };
      writeOnDisk('firebase.json', {
        hosting: [adminEntry, { target: 'my-app', public: 'dist/old-folder', cleanUrls: true }],
      });
      setHostingInFirebaseJson(projectRoot, 'my-app', 'dist/my-app/browser', 'index.html');
      expect(readFromDisk('firebase.json')).toEqual({
        hosting: [adminEntry, {
          target: 'my-app',
          public: 'dist/my-app/browser',
          cleanUrls: true,
          ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
          rewrites: [{ source: '**', destination: '/index.html' }],
        }],
      });
    });

    it('drops an earlier catch-all rewrite that sent every URL to a function', () => {
      writeOnDisk('firebase.json', {
        hosting: [{ target: 'my-app', public: 'dist/my-app/browser', rewrites: [{ source: '**', function: 'ssr' }] }],
      });
      setHostingInFirebaseJson(projectRoot, 'my-app', 'dist/my-app/browser', 'index.html');
      expect(readFromDisk('firebase.json').hosting[0].rewrites).toEqual([{ source: '**', destination: '/index.html' }]);
    });

    it('turns a lone entry with no target name into its own entry', () => {
      writeOnDisk('firebase.json', { hosting: { public: 'public', cleanUrls: true } });
      setHostingInFirebaseJson(projectRoot, 'my-app', 'dist/my-app/browser', 'index.html');
      expect(readFromDisk('firebase.json')).toEqual({
        hosting: [{
          target: 'my-app',
          public: 'dist/my-app/browser',
          cleanUrls: true,
          ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
          rewrites: [{ source: '**', destination: '/index.html' }],
        }],
      });
    });

    it('adds its entry beside a lone entry that deploys to a site by its id', () => {
      const siteEntry = { site: 'marketing-site', public: 'public' };
      writeOnDisk('firebase.json', { hosting: siteEntry });
      setHostingInFirebaseJson(projectRoot, 'my-app', 'dist/my-app/browser', 'index.html');
      const hostingEntries = readFromDisk('firebase.json').hosting;
      expect(hostingEntries.length).toBe(2);
      expect(hostingEntries[0]).toEqual(siteEntry);
    });

    it('removes the source and frameworksBackend settings that AngularFire wrote before 17.1', () => {
      writeOnDisk('firebase.json', {
        hosting: [{ target: 'my-app', source: '.', frameworksBackend: { region: 'us-central1' } }],
      });
      setHostingInFirebaseJson(projectRoot, 'my-app', 'dist/my-app/browser', 'index.html');
      const entry = readFromDisk('firebase.json').hosting[0];
      expect(entry.source).toBeUndefined();
      expect(entry.frameworksBackend).toBeUndefined();
      expect(entry.public).toBe('dist/my-app/browser');
    });

  });

  describe('alreadyDeploysLocalFiles', () => {

    it('is true when the entry of the backend has alwaysDeployFromSource set to true', () => {
      writeOnDisk('firebase.json', { apphosting: { backendId: 'my-backend', alwaysDeployFromSource: true } });
      expect(alreadyDeploysLocalFiles(projectRoot, 'my-backend')).toBeTrue();
    });

    it('is false when the entry of the backend does not have the setting', () => {
      writeOnDisk('firebase.json', { apphosting: { backendId: 'my-backend' } });
      expect(alreadyDeploysLocalFiles(projectRoot, 'my-backend')).toBeFalse();
    });

    it('is false when the entry of the backend has the setting set to false', () => {
      writeOnDisk('firebase.json', { apphosting: { backendId: 'my-backend', alwaysDeployFromSource: false } });
      expect(alreadyDeploysLocalFiles(projectRoot, 'my-backend')).toBeFalse();
    });

    it('is false when only the entry of another backend has the setting', () => {
      writeOnDisk('firebase.json', {
        apphosting: [{ backendId: 'other-backend', alwaysDeployFromSource: true }, { backendId: 'my-backend' }],
      });
      expect(alreadyDeploysLocalFiles(projectRoot, 'my-backend')).toBeFalse();
    });

    it('is false when there is no firebase.json', () => {
      expect(alreadyDeploysLocalFiles(projectRoot, 'my-backend')).toBeFalse();
    });

  });

  describe('setAppHostingInFirebaseJson', () => {

    const defaultIgnore = ['node_modules', '.git', '/dist', '.angular', 'firebase-debug.log'];

    it('creates firebase.json with one entry for the backend', () => {
      setAppHostingInFirebaseJson(projectRoot, 'my-backend', false);
      expect(readFromDisk('firebase.json')).toEqual({
        apphosting: { backendId: 'my-backend', rootDir: '.', ignore: defaultIgnore },
      });
    });

    it('writes alwaysDeployFromSource for a backend the user agreed to deploy local files to', () => {
      setAppHostingInFirebaseJson(projectRoot, 'my-backend', true);
      expect(readFromDisk('firebase.json').apphosting.alwaysDeployFromSource).toBeTrue();
    });

    it('keeps the settings the user changed in the entry of the backend', () => {
      const changedEntry = { backendId: 'my-backend', rootDir: 'apps/web', ignore: ['node_modules', 'docs'], localBuild: true };
      writeOnDisk('firebase.json', { apphosting: changedEntry });
      setAppHostingInFirebaseJson(projectRoot, 'my-backend', false);
      expect(readFromDisk('firebase.json')).toEqual({ apphosting: changedEntry });
    });

    it('rewrites the entry of the backend when it comes after the entry of another backend, which it leaves alone', () => {
      const entries = [
        { backendId: 'other-backend', rootDir: 'apps/admin', ignore: ['admin-only'] },
        { backendId: 'my-backend', rootDir: 'apps/web', ignore: ['web-only'] },
      ];
      writeOnDisk('firebase.json', { apphosting: entries });
      setAppHostingInFirebaseJson(projectRoot, 'my-backend', false);
      expect(readFromDisk('firebase.json')).toEqual({ apphosting: entries });
    });

    it('lists a second backend beside the first and keeps the other settings of the file', () => {
      const otherEntry = { backendId: 'other-backend', rootDir: 'apps/admin' };
      writeOnDisk('firebase.json', { hosting: [{ target: 'docs', public: 'docs' }], apphosting: otherEntry });
      setAppHostingInFirebaseJson(projectRoot, 'my-backend', false);
      expect(readFromDisk('firebase.json')).toEqual({
        hosting: [{ target: 'docs', public: 'docs' }],
        apphosting: [otherEntry, { backendId: 'my-backend', rootDir: '.', ignore: defaultIgnore }],
      });
    });

    it('stops with the path of a firebase.json that cannot be parsed, leaving it as it was', () => {
      writeFileSync(join(projectRoot, 'firebase.json'), '{ not json');
      expect(() => setAppHostingInFirebaseJson(projectRoot, 'my-backend', false))
        .toThrowError(/Error when parsing .*firebase\.json/);
      expect(readFileSync(join(projectRoot, 'firebase.json')).toString()).toBe('{ not json');
    });

  });

});

describe('setDeployTarget', () => {

  /** An angular.json in memory with the application `my-app`, and `deployEntry` as its deploy entry when given. */
  const workspaceWith = (deployEntry?: Record<string, unknown>): HostTree => {
    const architect: Record<string, unknown> = { build: { builder: '@angular/build:application', options: {} } };
    if (deployEntry) { architect.deploy = deployEntry; }

    const tree = new HostTree();
    tree.create('angular.json', JSON.stringify({
      version: 1,
      projects: { 'my-app': { root: '', projectType: 'application', architect } },
    }));
    return tree;
  };

  const deployEntryIn = (tree: HostTree) =>
    JSON.parse(tree.readText('angular.json')).projects['my-app'].architect.deploy;

  const hostingSettings = { appHostingBackend: undefined, firebaseProject: undefined };

  it('adds a deploy entry for Hosting to a project that has none', async () => {
    const tree = workspaceWith();
    await setDeployTarget('my-app', hostingSettings)(tree, context);
    expect(deployEntryIn(tree)).toEqual({ builder: '@angular/fire:deploy', options: { version: 2 } });
  });

  it('writes the backend for App Hosting', async () => {
    const tree = workspaceWith();
    await setDeployTarget('my-app', { appHostingBackend: 'my-backend', firebaseProject: undefined })(tree, context);
    expect(deployEntryIn(tree).options).toEqual({ version: 2, appHostingBackend: 'my-backend' });
  });

  it('writes the firebaseProject option when given one', async () => {
    const tree = workspaceWith();
    await setDeployTarget('my-app', { appHostingBackend: undefined, firebaseProject: 'my-project' })(tree, context);
    expect(deployEntryIn(tree).options).toEqual({ version: 2, firebaseProject: 'my-project' });
  });

  it('keeps the other options and the configurations of an earlier AngularFire entry', async () => {
    const tree = workspaceWith({
      builder: '@angular/fire:deploy',
      options: { buildTarget: 'my-app:build:staging' },
      configurations: { production: { buildTarget: 'my-app:build:production' } },
      defaultConfiguration: 'production',
    });
    await setDeployTarget('my-app', hostingSettings)(tree, context);
    expect(deployEntryIn(tree)).toEqual({
      builder: '@angular/fire:deploy',
      options: { buildTarget: 'my-app:build:staging', version: 2 },
      configurations: { production: { buildTarget: 'my-app:build:production' } },
      defaultConfiguration: 'production',
    });
  });

  it('replaces the backend of an earlier entry', async () => {
    const tree = workspaceWith({ builder: '@angular/fire:deploy', options: { version: 2, appHostingBackend: 'old-backend' } });
    await setDeployTarget('my-app', { appHostingBackend: 'new-backend', firebaseProject: undefined })(tree, context);
    expect(deployEntryIn(tree).options).toEqual({ version: 2, appHostingBackend: 'new-backend' });
  });

  it('replaces the firebaseProject option of an earlier entry', async () => {
    const tree = workspaceWith({ builder: '@angular/fire:deploy', options: { version: 2, firebaseProject: 'old-project' } });
    await setDeployTarget('my-app', { appHostingBackend: undefined, firebaseProject: 'new-project' })(tree, context);
    expect(deployEntryIn(tree).options).toEqual({ version: 2, firebaseProject: 'new-project' });
  });

  it('writes the firebaseProject option into an earlier entry that had none', async () => {
    const tree = workspaceWith({ builder: '@angular/fire:deploy', options: { version: 2 } });
    await setDeployTarget('my-app', { appHostingBackend: undefined, firebaseProject: 'new-project' })(tree, context);
    expect(deployEntryIn(tree).options).toEqual({ version: 2, firebaseProject: 'new-project' });
  });

  it('removes the backend when an App Hosting entry is set up for Hosting', async () => {
    const tree = workspaceWith({ builder: '@angular/fire:deploy', options: { version: 2, appHostingBackend: 'my-backend' } });
    await setDeployTarget('my-app', hostingSettings)(tree, context);
    expect(deployEntryIn(tree).options).toEqual({ version: 2 });
  });

  it('removes the firebaseProject and firebaseHostingSite options left from an earlier setup', async () => {
    const tree = workspaceWith({
      builder: '@angular/fire:deploy',
      options: { version: 2, firebaseProject: 'old-project', firebaseHostingSite: 'old-site' },
    });
    await setDeployTarget('my-app', hostingSettings)(tree, context);
    expect(deployEntryIn(tree).options).toEqual({ version: 2 });
  });

  it('replaces the deploy entry of another tool whole', async () => {
    const tree = workspaceWith({
      builder: 'angular-cli-ghpages:deploy',
      options: { baseHref: '/my-app/' },
      configurations: { production: { noBuild: true } },
    });
    await setDeployTarget('my-app', hostingSettings)(tree, context);
    expect(deployEntryIn(tree)).toEqual({ builder: '@angular/fire:deploy', options: { version: 2 } });
  });

  it('stops when the workspace does not have the project', async () => {
    const tree = workspaceWith();
    const run = async () => { await setDeployTarget('missing-app', hostingSettings)(tree, context); };
    await expectAsync(run()).toBeRejectedWithError(/"missing-app" is not defined/);
  });

});

describe('isValidBackendId', () => {

  it('accepts lowercase letters, numbers and hyphens that start with a letter', () => {
    expect(isValidBackendId('a77-ssr-apphosting')).toBeTrue();
  });

  it('accepts an id that ends with a number', () => {
    expect(isValidBackendId('store-v2')).toBeTrue();
  });

  it('rejects an underscore and a dot', () => {
    expect(isValidBackendId('my_app')).toBeFalse();
    expect(isValidBackendId('my.app')).toBeFalse();
  });

  it('accepts 3 characters and rejects 2', () => {
    expect(isValidBackendId('abc')).toBeTrue();
    expect(isValidBackendId('ab')).toBeFalse();
  });

  it('accepts 30 characters and rejects 31', () => {
    expect(isValidBackendId('a'.repeat(30))).toBeTrue();
    expect(isValidBackendId('a'.repeat(31))).toBeFalse();
  });

  it('rejects an uppercase letter', () => {
    expect(isValidBackendId('My-app')).toBeFalse();
  });

  it('rejects an id that starts with a number', () => {
    expect(isValidBackendId('3d-viewer')).toBeFalse();
  });

  it('rejects an id that ends with a hyphen', () => {
    expect(isValidBackendId('my-app-')).toBeFalse();
  });

});

describe('backendIdFromProjectName', () => {

  it('is the project name when that is already a valid id', () => {
    expect(backendIdFromProjectName('a77-ssr-apphosting')).toBe('a77-ssr-apphosting');
  });

  it('lowercases the project name', () => {
    expect(backendIdFromProjectName('MyApp')).toBe('myapp');
  });

  it('turns the scope and slash of a scoped project name into hyphens', () => {
    expect(backendIdFromProjectName('@acme/store-front')).toBe('acme-store-front');
  });

  it('cuts a long project name to 30 characters', () => {
    expect(backendIdFromProjectName('customer-account-management-portal')).toBe('customer-account-management-po');
  });

  it('drops a hyphen that the cut leaves at the end', () => {
    expect(backendIdFromProjectName('customer-account-management-x-portal')).toBe('customer-account-management-x');
  });

  it('is undefined when the project name is too short to be an id', () => {
    expect(backendIdFromProjectName('ab')).toBeUndefined();
  });

});
