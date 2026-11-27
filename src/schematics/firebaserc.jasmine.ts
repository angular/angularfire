import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import fsExtra from 'fs-extra';
import {
  hostingSiteFromRc,
  hostingSitesOfOtherTargets,
  projectsWithHostingTarget,
  readFirebaseRc,
} from './firebaserc.js';
import { FirebaseRc } from './interfaces.js';
import 'jasmine';

/** Two Firebase projects that both give the target name `my-app` a site, as staging and production would. */
const twoProjects: FirebaseRc = {
  projects: { default: 'staging-project' },
  targets: {
    'staging-project': { hosting: { 'my-app': ['staging-site'], admin: ['admin-site'] } },
    'production-project': { hosting: { 'my-app': ['production-site'] } },
    'docs-project': { hosting: { docs: ['docs-site'] } },
  },
};

/** A `.firebaserc` with a default project and no Hosting targets, as `ng add` leaves it with no deploy setup. */
const onlyDefaultProject: FirebaseRc = { projects: { default: 'staging-project' } };

describe('projectsWithHostingTarget', () => {

  it('lists the projects that give the target name a site, in the order of the file', () => {
    expect(projectsWithHostingTarget(twoProjects, 'my-app')).toEqual(['staging-project', 'production-project']);
  });

  it('is empty for a file with no targets', () => {
    expect(projectsWithHostingTarget(onlyDefaultProject, 'my-app')).toEqual([]);
  });

});

describe('hostingSiteFromRc', () => {

  it('is the site the project gives the target name', () => {
    expect(hostingSiteFromRc(twoProjects, 'production-project', 'my-app')).toBe('production-site');
  });

  it('is undefined when the project does not have the target name', () => {
    expect(hostingSiteFromRc(twoProjects, 'docs-project', 'my-app')).toBeUndefined();
  });

  it('is undefined when the file has targets for other projects only', () => {
    expect(hostingSiteFromRc(twoProjects, 'new-project', 'my-app')).toBeUndefined();
  });

  it('is undefined for a file with no targets', () => {
    expect(hostingSiteFromRc(onlyDefaultProject, 'staging-project', 'my-app')).toBeUndefined();
  });

});

describe('hostingSitesOfOtherTargets', () => {

  it('pairs each site of the project with the other target name that has it', () => {
    expect(hostingSitesOfOtherTargets(twoProjects, 'staging-project', 'my-app')).toEqual({ 'admin-site': 'admin' });
  });

  it('is empty when the project has no other target name', () => {
    expect(hostingSitesOfOtherTargets(twoProjects, 'production-project', 'my-app')).toEqual({});
  });

  it('is empty when the file has targets for other projects only', () => {
    expect(hostingSitesOfOtherTargets(twoProjects, 'new-project', 'my-app')).toEqual({});
  });

  it('is empty for a file with no targets', () => {
    expect(hostingSitesOfOtherTargets(onlyDefaultProject, 'staging-project', 'my-app')).toEqual({});
  });

});

describe('readFirebaseRc', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'angularfire-test-'));
  });

  afterEach(() => {
    fsExtra.removeSync(projectRoot);
  });

  it('reads .firebaserc from the workspace root', () => {
    writeFileSync(join(projectRoot, '.firebaserc'), JSON.stringify(twoProjects));
    expect(readFirebaseRc(projectRoot)).toEqual(twoProjects);
  });

  it('reads a missing file as empty', () => {
    expect(readFirebaseRc(projectRoot)).toEqual({});
  });

  it('reads a file that is not JSON as empty', () => {
    writeFileSync(join(projectRoot, '.firebaserc'), '{ not json');
    expect(readFirebaseRc(projectRoot)).toEqual({});
  });

});
