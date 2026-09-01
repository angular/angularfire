/*
 * Specs for the installed-copy reporter.
 *
 * Parsing is tested against output captured verbatim from real npm, pnpm, yarn 2+ and yarn
 * 1.x installs of workspaces holding two versions of one package.
 *
 * One spec at the end runs npm for real, because launching a package manager is the part that
 * captured output cannot test and the part that fails first on Windows. Every other case parses
 * captured output or stubs the spawn.
 */

import { lstatSync, mkdirSync, mkdtempSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  commandHost,
  detectPackageManager,
  distinctVersions,
  findInstalledCopies,
  formatInstalledCopies,
  parseInstalledEntries,
  queryArgsFor,
  yarnFromVersion,
} from './duplicatePackages/index.js';
import type { InstalledCopyReport, InstalledEntry, PackageManager, SpawnOutcome } from './duplicatePackages/index.js';
import 'jasmine';

/** Captured from `npm ls firebase --all --json`. */
const npmOutput = "{\"version\": \"1.0.0\", \"name\": \"c2\", \"dependencies\": {\"host-lib\": {\"version\": \"21.0.0-rc.1\", \"resolved\": \"file:/ws/host-lib-21.0.0-rc.1.tgz\", \"overridden\": false, \"dependencies\": {\"firebase\": {\"version\": \"12.18.0\", \"resolved\": \"https://registry.npmjs.org/firebase/-/firebase-12.18.0.tgz\", \"overridden\": false}, \"rxfire\": {\"version\": \"6.2.0\", \"resolved\": \"https://registry.npmjs.org/rxfire/-/rxfire-6.2.0.tgz\", \"overridden\": false, \"dependencies\": {\"firebase\": {\"version\": \"12.10.0\"}}}}}, \"firebase\": {\"version\": \"12.10.0\", \"resolved\": \"https://registry.npmjs.org/firebase/-/firebase-12.10.0.tgz\", \"overridden\": false}}}";

/** Captured from `pnpm -r ls ms --depth Infinity --json` in a pnpm workspace. */
const pnpmWorkspaceOutput = "[{\"name\": \"root\", \"version\": \"1.0.0\", \"path\": \"/ws\", \"private\": true, \"dependencies\": {\"ms\": {\"from\": \"ms\", \"version\": \"2.0.0\", \"resolved\": \"https://registry.npmjs.org/ms/-/ms-2.0.0.tgz\", \"path\": \"/ws/node_modules/.pnpm/ms@2.0.0/node_modules/ms\"}}}, {\"name\": \"web\", \"version\": \"1.0.0\", \"path\": \"/ws/packages/web\", \"private\": false, \"dependencies\": {\"ms\": {\"from\": \"ms\", \"version\": \"2.1.3\", \"resolved\": \"https://registry.npmjs.org/ms/-/ms-2.1.3.tgz\", \"path\": \"/ws/node_modules/.pnpm/ms@2.1.3/node_modules/ms\"}}}]";

/**
 * Captured verbatim from `pnpm -r ls firebase --depth Infinity --json`. Deliberately NOT
 * re-serialized: pnpm prints one array per project separated by a blank line, so the whole
 * output is several JSON documents rather than one, and `JSON.parse` on it throws.
 */
const pnpmConcatenatedOutput = "[\n  {\n    \"name\": \"app\",\n    \"version\": \"1.0.0\",\n    \"path\": \"/ws\",\n    \"private\": true,\n    \"dependencies\": {\n      \"firebase\": {\n        \"from\": \"firebase\",\n        \"version\": \"12.10.0\",\n        \"resolved\": \"https://registry.npmjs.org/firebase/-/firebase-12.10.0.tgz\",\n        \"path\": \"/ws/node_modules/.pnpm/firebase@12.10.0/node_modules/firebase\"\n      },\n      \"lib\": {\n        \"from\": \"lib\",\n        \"version\": \"file:lib\",\n        \"path\": \"/ws/node_modules/.pnpm/lib@file+lib/node_modules/lib\",\n        \"dependencies\": {\n          \"firebase\": {\n            \"from\": \"firebase\",\n            \"version\": \"12.18.0\",\n            \"resolved\": \"https://registry.npmjs.org/firebase/-/firebase-12.18.0.tgz\",\n            \"path\": \"/ws/node_modules/.pnpm/firebase@12.18.0/node_modules/firebase\"\n          }\n        }\n      }\n    }\n  }\n]\n\n[\n  {\n    \"name\": \"lib\",\n    \"version\": \"1.0.0\",\n    \"path\": \"/ws/lib\",\n    \"private\": false\n  }\n]";

/** Captured from `yarn why firebase --json`, which emits one object per line. */
const yarnOutput = [
  "{\"value\":\"app@workspace:.\",\"children\":{\"firebase@npm:12.10.0\":{\"locator\":\"firebase@npm:12.10.0\",\"descriptor\":\"firebase@npm:12.10.0\"}}}",
  "{\"value\":\"lib@portal:./lib::locator=app%40workspace%3A.\",\"children\":{\"firebase@npm:12.18.0\":{\"locator\":\"firebase@npm:12.18.0\",\"descriptor\":\"firebase@npm:12.18.0\"}}}",
].join('\n');

/** Captured from yarn 1.x `yarn list --pattern firebase --json --depth=Infinity`. */
const yarnClassicOutput = [
  "{\"type\":\"tree\",\"data\":{\"type\":\"list\",\"trees\":[{\"name\":\"@firebase/analytics@0.10.20\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/app@0.14.9\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/app-check@0.11.1\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/app-check-interop-types@0.3.3\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/app-types@0.9.3\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/auth@1.12.1\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/auth-interop-types@0.2.4\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/component@0.7.1\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/database@1.1.1\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/firestore@4.12.0\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/functions@0.13.2\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/installations@0.6.20\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/logger@0.5.2\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/messaging@0.12.24\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/messaging-interop-types@0.2.3\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/performance@0.7.10\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/remote-config@0.8.1\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/storage@0.14.1\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/util@1.14.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"firebase@12.10.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"lib@1.0.0\",\"children\":[{\"name\":\"firebase@12.18.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/ai@2.15.0\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/analytics-compat@0.2.30\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/analytics@0.10.24\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-check-compat@0.4.7\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-check@0.13.1\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-compat@0.5.17\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-types@0.9.6\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app@0.16.1\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/auth-compat@0.6.10\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/auth@1.13.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/data-connect@0.7.4\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/database-compat@2.1.7\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/database@1.1.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/firestore-compat@0.4.13\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/firestore@4.17.1\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/functions-compat@0.5.0\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/functions@0.14.0\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/installations-compat@0.2.24\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/installations@0.6.24\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/messaging-compat@0.2.29\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/messaging@0.13.2\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/performance-compat@0.2.27\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/performance@0.7.14\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/remote-config-compat@0.2.29\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/remote-config@0.9.2\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/storage-compat@0.4.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/storage@0.14.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/util@1.15.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/analytics-types@0.8.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-check-interop-types@0.3.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-check-types@0.5.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/auth-interop-types@0.2.6\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/auth-types@0.13.2\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/component@0.7.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/database-types@1.0.22\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/firestore-types@3.0.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/functions-types@0.6.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/installations-types@0.5.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/messaging-interop-types@0.2.6\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/performance-types@0.2.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/remote-config-types@0.5.2\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/storage-types@0.8.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/webchannel-wrapper@1.0.7\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0}],\"hint\":null,\"color\":\"bold\",\"depth\":0},{\"name\":\"@firebase/ai@2.9.0\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/analytics-compat@0.2.26\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-check-compat@0.4.1\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-compat@0.5.9\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/auth-compat@0.6.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/data-connect@0.4.0\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/database-compat@2.1.1\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/firestore-compat@0.4.6\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/functions-compat@0.4.2\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/installations-compat@0.2.20\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/messaging-compat@0.2.24\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/performance-compat@0.2.23\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/remote-config-compat@0.2.22\",\"children\":[{\"name\":\"@firebase/logger@0.5.0\",\"children\":[],\"hint\":null,\"color\":\"bold\",\"depth\":0}],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/storage-compat@0.4.1\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/webchannel-wrapper@1.0.5\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/analytics-types@0.8.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/app-check-types@0.5.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/auth-types@0.13.0\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/database-types@1.0.17\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/firestore-types@3.0.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/functions-types@0.6.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/installations-types@0.5.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/performance-types@0.2.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/remote-config-types@0.5.0\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0},{\"name\":\"@firebase/storage-types@0.8.3\",\"children\":[],\"hint\":null,\"color\":null,\"depth\":0}]}}",
].join('\n');

/**
 * Captured from `yarn why firebase --json` on a real yarn 4.10.3 workspace where `@angular/fire`
 * pulls in an older firebase. Yarn reports `@angular/fire` twice, plainly and in its virtual form,
 * because it declares peer dependencies. Both name the same copy on disk.
 */
const yarnVirtualDependentOutput = [
  "{\"value\":\"@angular/fire@npm:20.0.1\",\"children\":{\"firebase@npm:11.10.0\":{\"locator\":\"firebase@npm:11.10.0\",\"descriptor\":\"firebase@npm:^11.8.0\"}}}",
  "{\"value\":\"@angular/fire@virtual:3999943a9b754d09cf6c1ae4cf3cf41db165fbe2ffe8559fc545be213907f3c04c623f0835cfa59036634435752ca17aa3c187b7ce8d8452a65112fe13fd7663#npm:20.0.1\",\"children\":{\"firebase@npm:11.10.0\":{\"locator\":\"firebase@npm:11.10.0\",\"descriptor\":\"firebase@npm:^11.8.0\"}}}",
  "{\"value\":\"yarn-berry-angularfire-upgraded@workspace:.\",\"children\":{\"firebase@npm:12.18.0\":{\"locator\":\"firebase@npm:12.18.0\",\"descriptor\":\"firebase@npm:^12.0.0\"}}}",
].join('\n');

describe('installed copy reporting', () => {

  let workspaceRoot: string;

  /** Removes a directory tree. Recursive because the fixtures nest, and this repo's @types/node predates fs.rmSync. */
  const removeDirectory = (target: string) => {
    for (const entry of readdirSync(target)) {
      const entryPath = join(target, entry);
      /* lstat, not stat: a symlink to a directory must be unlinked, never followed, or teardown
       * deletes the target's contents. The module's domain is symlinked stores. */
      const entryStats = lstatSync(entryPath);
      if (entryStats.isDirectory()) { removeDirectory(entryPath); } else { unlinkSync(entryPath); }
    }
    rmdirSync(target);
  };

  const versionsOf = (packageManager: PackageManager, output: string, name: string) =>
    distinctVersions(parseInstalledEntries(packageManager, output, name));

  /** A spawn result with everything defaulted, so a case states only the part it is about. */
  const spawnOutcome = (outcome: Partial<SpawnOutcome> = {}): SpawnOutcome =>
    ({ stdout: '', status: 0, failure: undefined, ...outcome });

  beforeEach(() => { workspaceRoot = mkdtempSync(join(tmpdir(), 'angularfire-entries-')); });
  afterEach(() => { removeDirectory(workspaceRoot); });

  describe('parseInstalledEntries', () => {

    it('reads both versions from real npm output', () => {
      expect(versionsOf('npm', npmOutput, 'firebase')).toEqual(['12.10.0', '12.18.0']);
    });

    it('reads both versions from a real pnpm workspace', () => {
      expect(versionsOf('pnpm', pnpmWorkspaceOutput, 'ms')).toEqual(['2.0.0', '2.1.3']);
    });

    it('reads pnpm output that is several JSON documents rather than one', () => {
      // `pnpm -r` prints one array per project. Parsing the whole output at once throws.
      expect(() => JSON.parse(pnpmConcatenatedOutput)).toThrow();
      expect(versionsOf('pnpm', pnpmConcatenatedOutput, 'firebase')).toEqual(['12.10.0', '12.18.0']);
    });

    it('reads both versions from real yarn 2+ output', () => {
      expect(versionsOf('yarn', yarnOutput, 'firebase')).toEqual(['12.10.0', '12.18.0']);
    });

    it('reads both versions from real yarn 1.x output, whose format is unrelated', () => {
      expect(versionsOf('yarn-classic', yarnClassicOutput, 'firebase')).toEqual(['12.10.0', '12.18.0']);
    });

    it('does not read either yarn format with the other yarn parser', () => {
      // The formats share nothing, and the wrong parser returns silence rather than an error.
      expect(parseInstalledEntries('yarn', yarnClassicOutput, 'firebase')).toEqual([]);
      expect(parseInstalledEntries('yarn-classic', yarnOutput, 'firebase')).toEqual([]);
    });

    it('reads the version out of a yarn patch locator rather than a URL fragment', () => {
      const patched = JSON.stringify({
        value: 'root@workspace:.',
        children: { 'ms@patch:ms@npm%3A2.0.0#./p.patch::version=2.0.0&hash=2ff36f': {} },
      });
      expect(versionsOf('yarn', patched, 'ms')).toEqual(['2.0.0']);
    });

    /* Yarn wraps any package declaring peerDependencies as `virtual:<hash>#npm:<version>`.
     * rxfire declares peers, so without this the module reports nothing for its own example. */
    it('reads a yarn virtual locator, which every peer-declaring package gets', () => {
      const virtualized = JSON.stringify({
        value: 'root@workspace:.',
        children: { 'rxfire@virtual:36a01d8083315b8a#npm:6.2.0': {} },
      });
      expect(versionsOf('yarn', virtualized, 'rxfire')).toEqual(['6.2.0']);
    });

    it('names the pnpm workspace member an entry came from', () => {
      const entries = parseInstalledEntries('pnpm', pnpmWorkspaceOutput, 'ms');
      /* Without the member name every copy reads as "the workspace root", which is what `-r` was
       * added to see past. */
      expect(entries.some(entry => entry.dependencyPath.length > 0)).toBeTrue();
    });

    it('reads the aliased version, not the aliased name', () => {
      const alias = JSON.stringify({
        value: 'root@workspace:.',
        children: { 'firebase@npm:firebase-alt@1.2.3': {} },
      });
      expect(versionsOf('yarn', alias, 'firebase')).toEqual(['1.2.3']);
    });

    it('keeps a yarn workspace or portal copy, which is a real separate instance', () => {
      const linked = JSON.stringify({
        value: 'root@workspace:.',
        children: { 'fb@workspace:packages/fb': {} },
      });
      /* Dropping it would hide exactly the duplicate this module looks for. pnpm keeps its
       * equivalent (`file:lib`), so the two managers must not disagree about whether it exists. */
      expect(parseInstalledEntries('yarn', linked, 'fb').length).toBe(1);
    });

    it('says so when it walked output but recognized nothing in it', () => {
      const problems: string[] = [];
      parseInstalledEntries('pnpm', '[{"name":"a"}]\n\n{ not json }', 'firebase', problems);
      expect(problems.length).toBeGreaterThan(0);
    });

    it('does not mistake a package whose name merely starts the same', () => {
      const yarnOutput2 = JSON.stringify({ value: 'root@workspace:.', children: { 'firebase-tools@npm:14.0.0': {} } });
      expect(parseInstalledEntries('yarn', yarnOutput2, 'firebase')).toEqual([]);
      const classic = JSON.stringify({ type: 'tree', data: { trees: [{ name: 'firebase-tools@14.0.0', children: [] }] } });
      expect(parseInstalledEntries('yarn-classic', classic, 'firebase')).toEqual([]);
    });

    it('records how each entry was reached', () => {
      const entries = parseInstalledEntries('npm', npmOutput, 'firebase');
      expect(entries.some(entry => entry.dependencyPath.length > 0)).toBeTrue();
    });

    it('reports nothing for a package the output does not mention', () => {
      expect(parseInstalledEntries('npm', npmOutput, 'not-installed')).toEqual([]);
      expect(parseInstalledEntries('pnpm', pnpmWorkspaceOutput, 'not-installed')).toEqual([]);
      expect(parseInstalledEntries('yarn', yarnOutput, 'not-installed')).toEqual([]);
      expect(parseInstalledEntries('yarn-classic', yarnClassicOutput, 'not-installed')).toEqual([]);
    });

    it('walks a deep tree to the bottom rather than stopping partway', () => {
      let output = '{"version":"1.0.0","dependencies":{"firebase":{"version":"9.9.9"}}}';
      // 400 levels is far short of reaching the limits of the stack.
      for (let level = 0; level < 400; level++) {
        output = `{"version":"1.0.0","dependencies":{"level${level}":${output}}}`;
      }
      expect(versionsOf('npm', output, 'firebase')).toEqual(['9.9.9']);
    });

    it('skips a malformed line rather than failing the whole read', () => {
      expect(versionsOf('yarn', `not json\n${yarnOutput}`, 'firebase').length).toBeGreaterThan(0);
    });

    /* A skipped line is invisible in the result. If it was the one carrying the second version,
     * the report reads "1 distinct version" and the duplicate is simply gone. */
    it('says how many yarn lines it had to skip', () => {
      const problems: string[] = [];
      parseInstalledEntries('yarn', `{ broken\n${yarnOutput}`, 'firebase', problems);
      expect(problems.join(' ')).toContain('1 line of the output could not be read');
    });

    it('says how many yarn 1.x lines it had to skip', () => {
      const problems: string[] = [];
      parseInstalledEntries('yarn-classic', `not json\n${yarnClassicOutput}`, 'firebase', problems);
      expect(problems.join(' ')).toContain('1 line of the output could not be read');
    });

    it('counts one yarn dependent once even when it is reported on two lines', () => {
      const line = '{"value":"app@workspace:.","children":{"firebase@npm:12.10.0":{}}}';
      expect(parseInstalledEntries('yarn', `${line}\n${line}`, 'firebase'))
        .toEqual([{ version: '12.10.0', dependencyPath: ['app@workspace:.'] }]);
    });

    // One bad entry must not discard the good ones. Input is constructed: no npm emits this.
    it('skips a null tree entry rather than failing the whole read', () => {
      const withNullEntry = JSON.stringify({
        dependencies: { unresolved: null, firebase: { version: '12.18.0' } },
      });
      expect(parseInstalledEntries('npm', withNullEntry, 'firebase'))
        .toEqual([{ version: '12.18.0', dependencyPath: [] }]);
    });

  });

  describe('queryArgsFor', () => {

    /* Without -r pnpm reports the root project only, and a duplicate living in a workspace
     * member is missed with exit 0 and no warning. */
    it('asks pnpm recursively, so workspace members are included', () => {
      expect(queryArgsFor('pnpm', 'firebase')).toContain('-r');
    });

    it('asks each manager for machine-readable output', () => {
      expect(queryArgsFor('npm', 'firebase')).toContain('--json');
      expect(queryArgsFor('pnpm', 'firebase')).toContain('--json');
      expect(queryArgsFor('yarn', 'firebase')).toContain('--json');
      expect(queryArgsFor('yarn-classic', 'firebase')).toContain('--json');
    });

    it('uses yarn 1.x list rather than why, which reports prose', () => {
      expect(queryArgsFor('yarn-classic', 'firebase')[0]).toBe('list');
      expect(queryArgsFor('yarn', 'firebase')[0]).toBe('why');
    });

  });

  describe('distinctVersions', () => {

    it('orders versions numerically, not as strings', () => {
      const entries = ['12.9.0', '12.10.0', '9.0.0'].map(version => ({ version, dependencyPath: [] }));
      expect(distinctVersions(entries)).toEqual(['9.0.0', '12.9.0', '12.10.0']);
    });

    it('orders prereleases before their release, as semver requires', () => {
      const entries = ['1.0.0', '1.0.0-rc.2', '1.0.0-rc.1', '0.9.0']
        .map(version => ({ version, dependencyPath: [] }));
      expect(distinctVersions(entries)).toEqual(['0.9.0', '1.0.0-rc.1', '1.0.0-rc.2', '1.0.0']);
    });

    /* Comparing some pairs by semver and others as text can order a beats b beats c beats a,
     * and Array#sort given that returns a different answer for the same set each time. */
    it('orders the same set identically whatever order it arrives in', () => {
      const copiesOf = (versions: string[]) => versions.map(version => ({ version, dependencyPath: [] }));
      const first = distinctVersions(copiesOf(['9.0.0', '10.0.0', 'file:lib']));
      expect(distinctVersions(copiesOf(['file:lib', '9.0.0', '10.0.0']))).toEqual(first);
      expect(distinctVersions(copiesOf(['10.0.0', 'file:lib', '9.0.0']))).toEqual(first);
    });

    /* semver treats build metadata as equal, so the comparator ties and Set insertion order
     * would otherwise decide which of the two comes out first. */
    it('orders versions differing only in build metadata the same way every time', () => {
      const copiesOf = (versions: string[]) => versions.map(version => ({ version, dependencyPath: [] }));
      expect(distinctVersions(copiesOf(['1.0.0+b', '1.0.0+a'])))
        .toEqual(distinctVersions(copiesOf(['1.0.0+a', '1.0.0+b'])));
    });

    // pnpm reports things like `file:lib` for linked packages.
    it('keeps a stable order for versions semver cannot parse', () => {
      const entries = ['file:lib', '2.0.0'].map(version => ({ version, dependencyPath: [] }));
      expect(distinctVersions(entries).length).toBe(2);
    });

    it('collapses repeated versions', () => {
      const entries = ['2.8.1', '2.8.1', '2.8.1'].map(version => ({ version, dependencyPath: [] }));
      expect(distinctVersions(entries)).toEqual(['2.8.1']);
    });

  });

  describe('yarnFromVersion', () => {

    it('tells yarn 1.x apart from yarn 2+, which share a lockfile name', () => {
      expect(yarnFromVersion('1.22.22')).toBe('yarn-classic');
      // A corepack declaration may be a range or a bare major, not just a full version.
      expect(yarnFromVersion('1')).toBe('yarn-classic');
      expect(yarnFromVersion('^1.22.22')).toBe('yarn-classic');
      expect(yarnFromVersion('4.5.3')).toBe('yarn');
      // A future major must not read as classic just because it starts with a 1.
      expect(yarnFromVersion('10.0.0')).toBe('yarn');
      // An unreadable answer falls back to the parser that refuses unfamiliar input.
      expect(yarnFromVersion('')).toBe('yarn');
    });

  });

  describe('detectPackageManager', () => {

    // A migrated workspace often keeps a stale lockfile from the manager it left.
    it('prefers what the workspace declares over its lockfiles', () => {
      writeFileSync(join(workspaceRoot, 'pnpm-lock.yaml'), '');
      writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify({ packageManager: 'npm@10.9.8' }));
      expect(detectPackageManager(workspaceRoot)).toBe('npm');
    });

    it('reads the manager the Angular CLI was told to use', () => {
      writeFileSync(join(workspaceRoot, 'yarn.lock'), '');
      writeFileSync(join(workspaceRoot, 'angular.json'), JSON.stringify({ cli: { packageManager: 'pnpm' } }));
      expect(detectPackageManager(workspaceRoot)).toBe('pnpm');
    });

    it('reads which yarn from a corepack declaration without probing', () => {
      writeFileSync(join(workspaceRoot, 'yarn.lock'), '');
      writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify({ packageManager: 'yarn@1.22.22' }));
      expect(detectPackageManager(workspaceRoot)).toBe('yarn-classic');
    });

    // The Angular workspace is often apps/web while the lockfile is at the repo root.
    it('finds the lockfile at a monorepo root from a nested Angular workspace', () => {
      const nested = join(workspaceRoot, 'apps', 'web');
      mkdirSync(nested, { recursive: true });
      writeFileSync(join(workspaceRoot, 'package-lock.json'), '');
      expect(detectPackageManager(nested)).toBe('npm');
    });

    /* apps/web names its manager in its own angular.json and the repo root never mentions it.
     * Resolving to the root before reading declarations discards the more specific answer and
     * reports the lockfile's manager with no sign that anything was overlooked. */
    it('reads a nested workspace own declaration, not only the monorepo root', () => {
      const nested = join(workspaceRoot, 'apps', 'web');
      mkdirSync(nested, { recursive: true });
      writeFileSync(join(workspaceRoot, 'package-lock.json'), '');
      writeFileSync(join(nested, 'angular.json'), JSON.stringify({ cli: { packageManager: 'pnpm' } }));
      expect(detectPackageManager(nested)).toBe('pnpm');
    });

    /* Unbounded, the walk goes to the filesystem root, where a stray package-lock.json in a
     * home directory claims ownership of every project beneath it. The query then runs in a
     * directory the caller never named and reports a different tree. */
    it('gives up looking for a monorepo root a few levels up', () => {
      const deep = join(workspaceRoot, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');
      mkdirSync(deep, { recursive: true });
      writeFileSync(join(workspaceRoot, 'package-lock.json'), '');
      expect(detectPackageManager(deep)).toBeUndefined();
    });

    /* A bare `yarn` leaves open only which yarn, not whether it is yarn, and the first declaration
     * naming anything wins. */
    it('lets a versionless yarn declaration settle yarn and the probe pick which one', () => {
      writeFileSync(join(workspaceRoot, 'yarn.lock'), '');
      writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify({ packageManager: 'yarn' }));
      writeFileSync(join(workspaceRoot, 'angular.json'), JSON.stringify({ cli: { packageManager: 'pnpm' } }));
      spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: '4.5.3\n' }));
      expect(detectPackageManager(workspaceRoot)).toBe('yarn');
    });

    /* cli.packageManager is always a bare name, so if a versionless declaration cannot win,
     * the module's headline rule never applies to yarn at all. */
    it('lets a bare yarn declaration beat a lockfile from another manager', () => {
      const nested = join(workspaceRoot, 'apps', 'web');
      mkdirSync(nested, { recursive: true });
      writeFileSync(join(workspaceRoot, 'pnpm-lock.yaml'), '');
      writeFileSync(join(nested, 'angular.json'), JSON.stringify({ cli: { packageManager: 'yarn' } }));
      spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: '1.22.22\n' }));
      expect(detectPackageManager(nested)).toBe('yarn-classic');
    });

    /* Directories are read nearest-first so the specific answer wins. Skipping past bun to a
     * manager it can query hands a bun user an npm answer with nothing said about it. */
    it('lets a nearer unqueryable declaration beat a farther queryable one', () => {
      const nested = join(workspaceRoot, 'apps', 'web');
      mkdirSync(nested, { recursive: true });
      writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify({ packageManager: 'npm@10.0.0' }));
      writeFileSync(join(nested, 'angular.json'), JSON.stringify({ cli: { packageManager: 'bun' } }));
      const problems: string[] = [];
      expect(detectPackageManager(nested, problems)).toBeUndefined();
      expect(problems.join(' ')).toContain('declares bun');
    });

    it('identifies npm from its lockfile alone', () => {
      writeFileSync(join(workspaceRoot, 'package-lock.json'), '');
      expect(detectPackageManager(workspaceRoot)).toBe('npm');
    });

    it('identifies pnpm from its lockfile alone', () => {
      writeFileSync(join(workspaceRoot, 'pnpm-lock.yaml'), '');
      expect(detectPackageManager(workspaceRoot)).toBe('pnpm');
    });

    /* Nested past the walk bound so the answer cannot turn on what else happens to be in the
     * temp directory's ancestry: a lockfile left in /tmp by another job would otherwise decide. */
    it('returns undefined when nothing identifies a manager', () => {
      const isolated = join(workspaceRoot, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i');
      mkdirSync(isolated, { recursive: true });
      expect(detectPackageManager(isolated)).toBeUndefined();
    });

    /* cli.packageManager also accepts bun and cnpm, which deploy/actions.ts supports. Falling
     * through to the lockfile would answer with whichever manager a migration left behind. */
    it('says so when the declared manager is one it cannot ask', () => {
      writeFileSync(join(workspaceRoot, 'package-lock.json'), '');
      writeFileSync(join(workspaceRoot, 'angular.json'), JSON.stringify({ cli: { packageManager: 'bun' } }));
      const problems: string[] = [];
      expect(detectPackageManager(workspaceRoot, problems)).toBeUndefined();
      expect(problems.join(' ')).toContain('declares bun');
    });

    /* A corepack prompt goes to stderr and yarn still exits 0. Assuming yarn 2+ silently then
     * hands a yarn 1.x workspace the parser that reports nothing for it. */
    it('says so when the yarn probe exits cleanly but prints no version', () => {
      writeFileSync(join(workspaceRoot, 'yarn.lock'), '');
      spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ status: 0 }));
      const problems: string[] = [];
      expect(detectPackageManager(workspaceRoot, problems)).toBe('yarn');
      expect(problems.join(' ')).toContain('printed no version');
    });

    // The problem must not claim yarn 2+ was assumed while yarn-classic is what gets returned.
    it('uses the version yarn printed even when it exited badly, and says which', () => {
      writeFileSync(join(workspaceRoot, 'yarn.lock'), '');
      spyOn(commandHost, 'run').and.returnValue(
        spawnOutcome({ stdout: '1.22.22\n', status: 1 }));
      const problems: string[] = [];
      expect(detectPackageManager(workspaceRoot, problems)).toBe('yarn-classic');
      expect(problems.join(' ')).toContain('yarn-classic was used');
      expect(problems.join(' ')).not.toContain('yarn 2+ was assumed');
    });

  });

  describe('findInstalledCopies', () => {

    it('rejects a package name that could be read as a command or a flag', () => {
      // The name reaches a spawned process argv, so this is the boundary that keeps it inert.
      for (const unsafe of ['firebase; echo hi', 'firebase & calc', '--version', 'fire base', '']) {
        expect(() => findInstalledCopies(unsafe, workspaceRoot, { packageManager: 'npm' })).toThrow();
      }
    });

    // A rejected name is useless to someone who is not told which value to go and change.
    it('says what the rejected name was supplied as', () => {
      expect(() => findInstalledCopies('fire base', workspaceRoot, { packageManager: 'npm' }))
        .toThrowError(/as the package to report installed copies of/);
    });

    /* Nested past the walk bound for the same reason its detectPackageManager sibling is: a
     * stray lockfile in the temp directory's ancestry would otherwise make this really spawn. */
    it('queries nothing and says so when no manager can be identified', () => {
      const isolated = join(workspaceRoot, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i');
      mkdirSync(isolated, { recursive: true });
      const report = findInstalledCopies('firebase', isolated);
      expect(report.packageManager).toBeUndefined();
      expect(report.entries).toEqual([]);
      expect(report.problems.length).toBeGreaterThan(0);
    });

    /* spawnSync reports a kill on timeout as an error, not a status, so without a branch here
     * every real timeout reads as the package manager being missing or broken. */
    it('says the manager ran out of time rather than that it could not be run', () => {
      spyOn(commandHost, 'run').and.returnValue(
        spawnOutcome({ status: null, failure: 'spawnSync npm ETIMEDOUT' }));
      const report = findInstalledCopies('firebase', workspaceRoot, { packageManager: 'npm' });
      expect(report.problems.join(' ')).toContain('took longer than the 30 second timeout');
      expect(report.problems.join(' ')).not.toContain('could not run npm');
    });

    // A tree deep enough to use up the call stack must warn, not fall silent.
    it('reports a tree too deep to walk instead of falling silent', () => {
      let output = '{"version":"1.0.0"}';
      for (let level = 0; level < 20_000; level++) {
        output = `{"version":"1.0.0","dependencies":{"d":${output}}}`;
      }
      spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: output, status: 0 }));
      const report = findInstalledCopies('firebase', workspaceRoot, { packageManager: 'npm' });
      expect(report.problems.join(' ')).toContain('could not be parsed');
    });

    /* Verified against the real spawnSync: a command killed for exceeding maxBuffer is killed
     * exactly as a timeout is, differing only in the message. */
    it('does not call a buffer overflow a timeout', () => {
      spyOn(commandHost, 'run').and.returnValue(
        spawnOutcome({ status: null, failure: 'spawnSync npm ENOBUFS' }));
      const report = findInstalledCopies('firebase', workspaceRoot, { packageManager: 'npm' });
      expect(report.problems.join(' ')).toContain('could not run npm (spawnSync npm ENOBUFS)');
      expect(report.problems.join(' ')).not.toContain('took longer than');
    });

    it('reports a manager that could not be run', () => {
      spyOn(commandHost, 'run').and.returnValue(
        spawnOutcome({ status: null, failure: 'spawnSync npm ENOENT' }));
      const report = findInstalledCopies('firebase', workspaceRoot, { packageManager: 'npm' });
      expect(report.entries).toEqual([]);
      expect(report.problems.join(' ')).toContain('could not run npm (spawnSync npm ENOENT)');
    });


    it('separates output it could not read from a package that is absent', () => {
      spyOn(commandHost, 'run').and.returnValue(
        spawnOutcome({ stdout: 'some format nobody here parses' }));
      const report = findInstalledCopies('firebase', workspaceRoot, { packageManager: 'yarn' });
      expect(report.entries).toEqual([]);
      expect(report.problems.join(' ')).toContain("was not mentioned in yarn's output");
      expect(report.problems.join(' ')).not.toContain('exited without printing anything');
    });

    it('reports unparseable output rather than calling the tree clean', () => {
      spyOn(commandHost, 'run').and.returnValue(
        spawnOutcome({ stdout: '{ this is not json' }));
      const report = findInstalledCopies('firebase', workspaceRoot, { packageManager: 'npm' });
      expect(report.entries).toEqual([]);
      expect(report.problems.join(' ')).toContain('could not be parsed');
    });

    it('treats a clean exit with no output as no copies, not as a failed check', () => {
      /* Exit 0 with nothing printed is yarn 2+'s well-formed answer for "nothing depends on this
       * package". No copies means no duplicate, so recording a problem here made a correct "no"
       * read as a failed check. The stale-lockfile case this used to flag now goes silent, a
       * tradeoff taken deliberately: the shipping caller asks about firebase right after ng add
       * installed it, so its lockfile entry is fresh. */
      spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: '' }));
      const report = findInstalledCopies('firebase', workspaceRoot, { packageManager: 'yarn' });
      expect(report.entries).toEqual([]);
      expect(report.problems).toEqual([]);
      // And it must not assert absence: "is not installed" may only appear as one of two options.
      expect(report.problems.join(' ')).not.toContain('firebase is not installed,');
    });

    ['npm', 'pnpm', 'yarn', 'yarn-classic'].forEach(manager => {
      it(`still flags an empty answer from ${manager} when it exited non-zero`, () => {
        /* The rule is about finding nothing, not about which manager found nothing. Narrowing it
         * to one manager lets the other two silently go back to reporting all-clear. */
        spyOn(commandHost, 'run').and.returnValue(spawnOutcome({ stdout: '', status: 1 }));
        const report = findInstalledCopies('firebase', workspaceRoot,
          { packageManager: manager as PackageManager });
        expect(report.entries).toEqual([]);
        expect(report.problems.length).toBeGreaterThan(0);
      });
    });

    it('reads a real answer through commandHost, not a stub', () => {
      spyOn(commandHost, 'run').and.returnValue(
        spawnOutcome({ stdout: npmOutput }));
      const report = findInstalledCopies('firebase', workspaceRoot, { packageManager: 'npm' });
      expect(report.versions).toEqual(['12.10.0', '12.18.0']);
      expect(report.problems).toEqual([]);
    });

  });

  describe('formatInstalledCopies', () => {

    const reportFrom = (entries: InstalledEntry[], problems: string[] = []): InstalledCopyReport => ({
      packageName: 'firebase', packageManager: 'npm', entries,
      versions: distinctVersions(entries), problems,
    });

    it('counts a peer-declaring dependent once, not once per virtual form', () => {
      /* Real yarn reports @angular/fire twice for one copy, plainly and as
       * name@virtual:<hash>#<descriptor>. Rendered as they arrive, one copy became two lines, the
       * second 130 characters of hash, and the header read "3 dependents" for two. */
      const entries = parseInstalledEntries('yarn', yarnVirtualDependentOutput, 'firebase');
      expect(entries).toEqual([
        { version: '11.10.0', dependencyPath: ['@angular/fire@npm:20.0.1'] },
        { version: '12.18.0', dependencyPath: ['yarn-berry-angularfire-upgraded@workspace:.'] },
      ]);
      const text = formatInstalledCopies(reportFrom(entries)).join('\n');
      expect(text).toContain('reached by 2 dependent packages');
      expect(text).not.toContain('virtual:');
    });

    it('leads with distinct versions and calls the rest dependents, not entries', () => {
      const entries = parseInstalledEntries('npm', npmOutput, 'firebase');
      const text = formatInstalledCopies(reportFrom(entries)).join('\n');
      expect(text).toContain('distinct versions');
      /* One version reached by many dependent packages is usually one directory. Calling those
       * "entries" reads as that many entries. */
      expect(text).toContain('dependent packages');
      expect(text).toContain('12.10.0');
      expect(text).toContain('12.18.0');
    });

    it('renders no verdict and no advice', () => {
      const text = formatInstalledCopies(reportFrom(parseInstalledEntries('npm', npmOutput, 'firebase'))).join('\n');
      expect(text).not.toContain('runtime');
      expect(text).not.toContain('reinstall');
      expect(text).not.toContain('safe');
    });

    it('caps the rendered list rather than printing one line per dependent', () => {
      const entries = Array.from({ length: 40 }, (_, index) => ({ version: '1.0.0', dependencyPath: [`p${index}`] }));
      const text = formatInstalledCopies(reportFrom(entries));
      expect(text.length).toBeLessThan(30);
      expect(text.join('\n')).toContain('more');
    });

    it('keeps a line for every distinct version when the list is capped', () => {
      /* The second version is the whole point of the report and it can be the last thing the
       * manager listed. Cutting the list in arrival order leaves a header reading "2 distinct
       * versions" above twenty lines that all show the first one. */
      const entries = [
        ...Array.from({ length: 40 }, (_, index) => ({ version: '1.0.0', dependencyPath: [`p${index}`] })),
        { version: '2.0.0', dependencyPath: ['late'] },
      ];
      const text = formatInstalledCopies(reportFrom(entries));
      expect(text.length).toBeLessThan(30);
      expect(text.join('\n')).toContain('2.0.0 via late');
    });

    it('says how many versions it could not name when they outnumber the cap', () => {
      /* Past the cap not even one line per version fits, and the header count would otherwise be
       * the only trace of the ones left out. */
      const entries = Array.from({ length: 25 }, (_, index) => ({
        version: `1.0.${index}`, dependencyPath: [`p${index}`],
      }));
      const text = formatInstalledCopies(reportFrom(entries)).join('\n');
      expect(text).toContain('25 distinct versions');
      expect(text).toContain('5 further versions not listed here');
    });

    it('surfaces problems so a short answer is never mistaken for a complete one', () => {
      const text = formatInstalledCopies(reportFrom([], ['npm reported a problem with the tree: invalid'])).join('\n');
      expect(text).toContain('problem: npm reported a problem');
    });

  });

  describe('starting a package manager for real', () => {

    /*
     * The rest of this file reads captured output, which cannot show whether the spawn itself
     * works. On Windows npm, yarn and pnpm are installed as `.cmd` shims that
     * `child_process.execFile` cannot launch, which is the entire reason this code uses
     * cross-spawn. Only running one can show that it holds, and CI runs this file on
     * windows-latest as well as ubuntu and macos.
     *
     * npm only: it ships with Node, so it is present wherever these specs run. yarn and pnpm are
     * not, and a spec needing them would be testing the runner rather than the code.
     */

    let realTree: string;
    let realTreeTempRoot: string;

    beforeEach(() => {
      /* Nested past the walk bound, like the detection specs above: findInstalledCopies resolves
       * the workspace root upward, and a lockfile left in /tmp by another job would otherwise
       * relocate the query. */
      realTreeTempRoot = mkdtempSync(join(tmpdir(), 'angularfire-spawn-'));
      realTree = join(realTreeTempRoot, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i');
      const nested = join(realTree, 'node_modules', 'host', 'node_modules', 'alpha');
      mkdirSync(nested, { recursive: true });
      mkdirSync(join(realTree, 'node_modules', 'alpha'), { recursive: true });
      /* `npm ls` reads node_modules and the package.json files in it, so a tree can be written by
       * hand. Installing for real would need a network and would make this the slowest spec here. */
      const write = (directory: string, manifest: Record<string, unknown>) =>
        writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest));
      write(realTree, { name: 'root', version: '1.0.0', dependencies: { alpha: '1.0.0', host: '1.0.0' } });
      write(join(realTree, 'node_modules', 'alpha'), { name: 'alpha', version: '1.0.0' });
      write(join(realTree, 'node_modules', 'host'), { name: 'host', version: '1.0.0', dependencies: { alpha: '2.0.0' } });
      write(nested, { name: 'alpha', version: '2.0.0' });
    });

    afterEach(() => removeDirectory(realTreeTempRoot));

    it('finds both versions by actually running npm', () => {
      /* `packageManager` is passed rather than detected: identifying it is pure filesystem work
       * that the specs above already cover on every operating system. What is untested anywhere
       * else, and what fails first on Windows, is launching the manager. */
      const report = findInstalledCopies('alpha', realTree, { packageManager: 'npm' });
      expect(report.problems).toEqual([]);
      expect(report.versions).toEqual(['1.0.0', '2.0.0']);
      expect(report.entries.length).toBe(2);
    }, 60_000);

  });

});
