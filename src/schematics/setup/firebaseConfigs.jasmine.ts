import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { logging } from '@angular-devkit/core';
import { HostTree, SchematicContext } from '@angular-devkit/schematics';
import fsExtra from 'fs-extra';
import { FEATURES } from '../interfaces.js';
import {
  addFirestoreToFirebaseJson,
  createFirestoreStarterFiles,
  setDefaultProjectInFirebaseRc,
} from './firebaseConfigs.js';
import 'jasmine';

const context = { logger: new logging.Logger('test') } as unknown as SchematicContext;

describe('setDefaultProjectInFirebaseRc', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'angularfire-test-'));
  });

  afterEach(() => {
    fsExtra.removeSync(projectRoot);
  });

  const firebaseRcOnDisk = () =>
    JSON.parse(readFileSync(join(projectRoot, '.firebaserc')).toString());

  it('creates .firebaserc recording the selected project as default', () => {
    setDefaultProjectInFirebaseRc(projectRoot, 'my-project');
    expect(firebaseRcOnDisk()).toEqual({
      projects: { default: 'my-project' },
    });
  });

  it('merges into an existing .firebaserc, preserving targets and other aliases', () => {
    writeFileSync(join(projectRoot, '.firebaserc'), JSON.stringify({
      projects: { default: 'old-project', staging: 'staging-project' },
      targets: { 'old-project': { hosting: { app: ['app-site'] } } },
    }));
    setDefaultProjectInFirebaseRc(projectRoot, 'new-project');
    expect(firebaseRcOnDisk()).toEqual({
      projects: { default: 'new-project', staging: 'staging-project' },
      targets: { 'old-project': { hosting: { app: ['app-site'] } } },
    });
  });

  it('names the file when an existing .firebaserc cannot be parsed', () => {
    writeFileSync(join(projectRoot, '.firebaserc'), '{ not json');
    expect(() => setDefaultProjectInFirebaseRc(projectRoot, 'my-project'))
      .toThrowError(/\.firebaserc/);
  });

});

describe('createFirestoreStarterFiles', () => {

  it('creates test-mode rules and an empty index manifest when Firestore is selected', () => {
    const tree = new HostTree();
    createFirestoreStarterFiles(tree, context, [FEATURES.Firestore]);
    const rules = tree.readText('/firestore.rules');
    expect(rules).toContain("rules_version='2'");
    expect(rules).toContain('allow read, write: if request.time < timestamp.date(');
    expect(JSON.parse(tree.readText('/firestore.indexes.json'))).toEqual({
      indexes: [],
      fieldOverrides: [],
    });
  });

  it('sets the rules to expire roughly 30 days out', () => {
    const tree = new HostTree();
    createFirestoreStarterFiles(tree, context, [FEATURES.Firestore]);
    const match = /timestamp\.date\((\d+), (\d+), (\d+)\)/.exec(tree.readText('/firestore.rules'));
    expect(match).not.toBeNull();
    const [, year, month, day] = match.map(Number);
    const expiry = new Date(year, month - 1, day);
    const daysOut = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysOut).toBeGreaterThan(28);
    expect(daysOut).toBeLessThan(31);
  });

  it('never overwrites an existing rules file', () => {
    const tree = new HostTree();
    tree.create('/firestore.rules', 'my existing rules');
    createFirestoreStarterFiles(tree, context, [FEATURES.Firestore]);
    expect(tree.readText('/firestore.rules')).toBe('my existing rules');
  });

  it('still creates the index manifest when only the rules file exists', () => {
    const tree = new HostTree();
    tree.create('/firestore.rules', 'my existing rules');
    createFirestoreStarterFiles(tree, context, [FEATURES.Firestore]);
    expect(tree.exists('/firestore.indexes.json')).toBeTrue();
  });

  it('does nothing when Firestore is not selected', () => {
    const tree = new HostTree();
    createFirestoreStarterFiles(tree, context, [FEATURES.Authentication]);
    expect(tree.exists('/firestore.rules')).toBeFalse();
    expect(tree.exists('/firestore.indexes.json')).toBeFalse();
  });

  it('creates nothing when firebase.json already has a firestore section', () => {
    const tree = new HostTree();
    createFirestoreStarterFiles(tree, context, [FEATURES.Firestore], {
      firestore: { rules: 'custom.rules' },
    });
    expect(tree.exists('/firestore.rules')).toBeFalse();
    expect(tree.exists('/firestore.indexes.json')).toBeFalse();
  });

});

describe('addFirestoreToFirebaseJson', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'angularfire-test-'));
  });

  afterEach(() => {
    fsExtra.removeSync(projectRoot);
  });

  const firebaseJsonOnDisk = () =>
    JSON.parse(readFileSync(join(projectRoot, 'firebase.json')).toString());

  it('adds the firestore section pointing at the starter files', () => {
    writeFileSync(join(projectRoot, 'firebase.json'), '{}');
    addFirestoreToFirebaseJson(projectRoot, context, [FEATURES.Firestore]);
    expect(firebaseJsonOnDisk().firestore).toEqual({
      rules: 'firestore.rules',
      indexes: 'firestore.indexes.json',
    });
  });

  it('preserves sections other tools wrote to firebase.json', () => {
    writeFileSync(join(projectRoot, 'firebase.json'), JSON.stringify({
      dataconnect: { source: 'dataconnect' },
    }));
    addFirestoreToFirebaseJson(projectRoot, context, [FEATURES.Firestore]);
    expect(firebaseJsonOnDisk().dataconnect).toEqual({ source: 'dataconnect' });
    expect(firebaseJsonOnDisk().firestore).toBeDefined();
  });

  it('leaves an existing firestore section untouched', () => {
    writeFileSync(join(projectRoot, 'firebase.json'), JSON.stringify({
      firestore: { rules: 'custom.rules' },
    }));
    addFirestoreToFirebaseJson(projectRoot, context, [FEATURES.Firestore]);
    expect(firebaseJsonOnDisk().firestore).toEqual({ rules: 'custom.rules' });
  });

  it('does nothing when Firestore is not selected', () => {
    writeFileSync(join(projectRoot, 'firebase.json'), '{}');
    addFirestoreToFirebaseJson(projectRoot, context, [FEATURES.Authentication]);
    expect(firebaseJsonOnDisk().firestore).toBeUndefined();
  });

  it('warns and skips when firebase.json cannot be read', () => {
    const warnSpy = spyOn(context.logger, 'warn');
    addFirestoreToFirebaseJson(projectRoot, context, [FEATURES.Firestore]);
    expect(warnSpy).toHaveBeenCalled();
  });

});
