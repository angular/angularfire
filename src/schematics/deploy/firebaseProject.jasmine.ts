import { BuilderContext } from '@angular-devkit/architect';
import { logging } from '@angular-devkit/core';
import inquirer from 'inquirer';
import { FirebaseRc } from '../interfaces';
import { chooseFirebaseProject } from './firebaseProject.js';
import 'jasmine';

const conflict = /is in conflict/;

/** The target name `my-app` under one Firebase project, which is not the default project. */
const targetUnderOneProject: FirebaseRc = {
  projects: { default: 'default-project' },
  targets: { 'production-project': { hosting: { 'my-app': ['production-site'] } } },
};

/**
 * The target name `my-app` under three Firebase projects. `staging-project` is neither the first
 * one listed nor the default project, so a spec that uses it can tell those three apart.
 */
const targetUnderSeveralProjects: FirebaseRc = {
  projects: { default: 'production-project' },
  targets: {
    'dev-project': { hosting: { 'my-app': ['dev-site'] } },
    'staging-project': { hosting: { 'my-app': ['staging-site'] } },
    'production-project': { hosting: { 'my-app': ['production-site'] } },
  },
};

describe('chooseFirebaseProject', () => {
  let context: BuilderContext;
  let terminalAtStart: boolean;
  let prompt: jasmine.Spy<typeof inquirer.prompt>;

  /** Makes the code under test see a terminal, or none, whatever the specs themselves run in. */
  const setTerminal = (present: boolean) => { process.stdin.isTTY = present; };

  beforeEach(() => {
    context = { logger: new logging.Logger('test') } as unknown as BuilderContext;
    terminalAtStart = process.stdin.isTTY;

    // Every spec starts with no terminal and a question that answers `staging-project` if asked.
    setTerminal(false);
    prompt = spyOn(inquirer, 'prompt').and.resolveTo({ projectId: 'staging-project' });
  });

  afterEach(() => {
    process.stdin.isTTY = terminalAtStart;
  });

  describe('with the target name under one Firebase project or none', () => {

    it('is the default project when .firebaserc has no Hosting targets', async () => {
      const firebaseRc: FirebaseRc = { projects: { default: 'default-project' } };
      expect(await chooseFirebaseProject(context, firebaseRc, 'my-app', {})).toBe('default-project');
    });

    it('is the project that has the target name, not the default project', async () => {
      expect(await chooseFirebaseProject(context, targetUnderOneProject, 'my-app', {})).toBe('production-project');
    });

    it('asks nothing at a terminal', async () => {
      setTerminal(true);
      await chooseFirebaseProject(context, targetUnderOneProject, 'my-app', {});
      expect(prompt).not.toHaveBeenCalled();
    });

    it('accepts a firebaseProject option that agrees with .firebaserc', async () => {
      const options = { firebaseProject: 'production-project' };
      expect(await chooseFirebaseProject(context, targetUnderOneProject, 'my-app', options)).toBe('production-project');
    });

    it('stops when the firebaseProject option disagrees with .firebaserc', async () => {
      const options = { firebaseProject: 'default-project' };
      await expectAsync(chooseFirebaseProject(context, targetUnderOneProject, 'my-app', options))
        .toBeRejectedWithError(conflict);
    });

    it('stops when the firebaseProject option is set and .firebaserc has no project', async () => {
      const options = { firebaseProject: 'production-project' };
      await expectAsync(chooseFirebaseProject(context, {}, 'my-app', options)).toBeRejectedWithError(conflict);
    });

    it('stops when neither file has a project', async () => {
      await expectAsync(chooseFirebaseProject(context, {}, 'my-app', {}))
        .toBeRejectedWithError(/Cannot determine the Firebase Project/);
    });

  });

  describe('for an App Hosting deploy', () => {

    const options = { appHostingBackend: 'my-backend' };

    it('is the default project, whatever project has the Hosting target name', async () => {
      expect(await chooseFirebaseProject(context, targetUnderOneProject, 'my-app', options)).toBe('default-project');
    });

    it('is the default project with the target name under several projects, and asks nothing', async () => {
      setTerminal(true);
      expect(await chooseFirebaseProject(context, targetUnderSeveralProjects, 'my-app', options)).toBe('production-project');
      expect(prompt).not.toHaveBeenCalled();
    });

  });

  describe('with the target name under several Firebase projects', () => {

    it('is the firebaseProject option when it is one of them, with no terminal', async () => {
      const options = { firebaseProject: 'staging-project' };
      expect(await chooseFirebaseProject(context, targetUnderSeveralProjects, 'my-app', options)).toBe('staging-project');
    });

    it('is the firebaseProject option when it is one of them, and asks nothing at a terminal', async () => {
      setTerminal(true);
      prompt.and.resolveTo({ projectId: 'dev-project' });
      const options = { firebaseProject: 'staging-project' };

      expect(await chooseFirebaseProject(context, targetUnderSeveralProjects, 'my-app', options)).toBe('staging-project');

      expect(prompt).not.toHaveBeenCalled();
    });

    it('stops when the firebaseProject option is none of them', async () => {
      const options = { firebaseProject: 'default-project' };
      await expectAsync(chooseFirebaseProject(context, targetUnderSeveralProjects, 'my-app', options))
        .toBeRejectedWithError(conflict);
    });

    it('with no terminal, deploys nowhere and says how to choose a project', async () => {
      const error = spyOn(context.logger, 'error');

      expect(await chooseFirebaseProject(context, targetUnderSeveralProjects, 'my-app', {})).toBeUndefined();

      expect(prompt).not.toHaveBeenCalled();
      const message: string = error.calls.mostRecent().args[0];
      expect(message).toContain('the Hosting target "my-app" under more than one Firebase project');
      expect(message).toContain('(dev-project, staging-project, production-project)');
      expect(message).toContain('add "firebaseProject": "<project id>" to the deploy options of "my-app" in angular.json');
      expect(message).toContain('ng deploy --firebase-project=<project id>');
    });

    it('at a terminal, asks one list question with those projects as the choices, starting on the default project', async () => {
      setTerminal(true);

      await chooseFirebaseProject(context, targetUnderSeveralProjects, 'my-app', {});

      expect(prompt).toHaveBeenCalledTimes(1);
      expect(prompt.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
        type: 'list',
        name: 'projectId',
        choices: ['dev-project', 'staging-project', 'production-project'],
        default: 'production-project',
      }));
    });

    it('at a terminal, deploys to the answer and says how to skip the question', async () => {
      setTerminal(true);
      const info = spyOn(context.logger, 'info');

      expect(await chooseFirebaseProject(context, targetUnderSeveralProjects, 'my-app', {})).toBe('staging-project');

      const message: string = info.calls.mostRecent().args[0];
      expect(message).toContain('To skip this question');
      expect(message).toContain('add "firebaseProject": "staging-project" to the deploy options of "my-app" in angular.json');
      expect(message).toContain('ng deploy --firebase-project=staging-project');
    });

  });

});
