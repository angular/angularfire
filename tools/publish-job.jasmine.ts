import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import fsExtra from 'fs-extra';
import { tmpdir } from 'os';
import { join } from 'path';
import * as publishJob from './publish-job.js';
import 'jasmine';

type DistTags = Record<string, string>;

interface FakeActionsOptions {
  version: string;
  // One entry per read of npm's dist-tags. The last entry repeats.
  distTagReads: (DistTags | Error)[];
  // Leave out to make any read of the repository's tags fail the spec.
  gitTags?: string[];
  npmFails?: boolean;
  // The commit being published, and main's history as each commit's full list of ancestors.
  commit?: string;
  history?: Record<string, string[]>;
}

interface FakeRecord {
  logs: string[];
  outputs: Record<string, string>;
  commands: string[];
  sleeps: number;
}

const unreadable = (url: string) => new Error(`Could not read ${url}: fetch failed (ENOTFOUND).`);
const distTagsUrl = 'https://registry.npmjs.org/-/package/@angular/fire/dist-tags';

/** A publish job with no network, no git, no npm and a clock that only `sleep` moves. */
function fakeActions({ version, distTagReads, gitTags, npmFails = false, commit = '', history = {} }: FakeActionsOptions) {
  let clock = 0;
  const reads = [...distTagReads];
  const record: FakeRecord = { logs: [], outputs: {}, commands: [], sleeps: 0 };
  const actions = {
    version: () => version,
    fetchDistTags: async () => {
      const read = reads.length > 1 ? reads.shift() : reads[0];
      if (read instanceof Error) {
        throw read;
      }
      return read;
    },
    gitTags: () => {
      if (!gitTags) {
        throw new Error('This step must not read the repository\'s tags.');
      }
      return gitTags;
    },
    commit: () => commit,
    cloneHistory: () => undefined,
    resolveCommit: (abbreviation: string) => {
      const matches = Object.keys(history).filter(sha => sha.startsWith(abbreviation));
      if (matches.length !== 1) {
        throw new Error('fatal: Needed a single revision');
      }
      return matches[0];
    },
    isAncestor: (ancestor: string, descendant: string) => ancestor === descendant || (history[descendant] ?? []).includes(ancestor),
    run: (command: string, args: string[]) => {
      record.commands.push([command, ...args].join(' '));
      if (npmFails) {
        throw new Error('npm error code E400');
      }
    },
    sleep: async (seconds: number) => {
      clock += seconds * 1000;
      record.sleeps++;
    },
    now: () => clock,
    setOutput: (name: string, value: string) => {
      record.outputs[name] = value;
    },
    log: (message: string) => {
      record.logs.push(message);
    },
  };
  return { actions, record };
}

const tagsAfter21 = ['20.0.3', '20.1.0', '21.0.0-rc.1', '21.0.0'];
const moveNextCommand = 'npm dist-tag add @angular/fire@21.0.0 next --registry https://wombat-dressing-room.appspot.com';

describe('publish-job.js canary-check', () => {
  // main: aaaaaaa1, then bbbbbbb2, then ccccccc3. ddddddd4 is on no line of main's history.
  const history = { aaaaaaa1: [], bbbbbbb2: ['aaaaaaa1'], ccccccc3: ['aaaaaaa1', 'bbbbbbb2'], ddddddd4: [] };
  const canaryOf = (sha: string) => `21.0.1-canary.20261001000000.sha-${sha.slice(0, 7)}`;
  const check = (commit: string, npmCanary: string) =>
    fakeActions({ version: canaryOf(commit), distTagReads: [{ canary: npmCanary }], commit, history });

  it('publishes a canary of a later commit', async () => {
    const { actions, record } = check('ccccccc3', canaryOf('bbbbbbb2'));
    expect(await publishJob.runStep('canary-check', [], actions)).toBe(0);
    expect([record.outputs, record.logs]).toEqual([{}, []]);
  });

  it('skips a canary of an earlier commit', async () => {
    const { actions, record } = check('aaaaaaa1', canaryOf('bbbbbbb2'));
    expect(await publishJob.runStep('canary-check', [], actions)).toBe(0);
    expect(record.outputs).toEqual({ skip: 'true' });
    expect(record.logs).toEqual([`::warning::Not publishing ${canaryOf('aaaaaaa1')}, because the canary on npm, ${canaryOf('bbbbbbb2')}, is from a later commit on main.`]);
  });

  it('skips the canary already on npm, and publishes another version of the same commit', async () => {
    const same = check('bbbbbbb2', canaryOf('bbbbbbb2'));
    expect(await publishJob.runStep('canary-check', [], same.actions)).toBe(0);
    expect(same.record.outputs).toEqual({ skip: 'true' });
    expect(same.record.logs[0]).toMatch(/^::notice::Not publishing .* because it is already the canary on npm\.$/);
    const renamed = check('bbbbbbb2', '21.0.0-canary.bbbbbbb');
    expect(await publishJob.runStep('canary-check', [], renamed.actions)).toBe(0);
    expect(renamed.record.outputs).toEqual({});
  });

  it('fails when the canary on npm is not a commit on main\'s line', async () => {
    const unrelated = check('ccccccc3', canaryOf('ddddddd4'));
    expect(await publishJob.runStep('canary-check', [], unrelated.actions)).toBe(1);
    expect(unrelated.record.logs[0]).toMatch(/^::error::Not publishing .* are not on the same line of history\. One of them is not on main\. Every canary publish fails/);
    const unknown = check('ccccccc3', canaryOf('eeeeeee5'));
    expect(await publishJob.runStep('canary-check', [], unknown.actions)).toBe(1);
    expect(unknown.record.logs[0]).toMatch(/^::error::Could not match the canary on npm, .*sha-eeeeeee, to a single commit in this repository\./);
  });
});

describe('publish-job.js release-tag', () => {

  it('publishes a new major to latest', async () => {
    const { actions, record } = fakeActions({ version: '21.0.0', distTagReads: [{ latest: '20.1.0', next: '21.0.0-rc.1' }], gitTags: tagsAfter21 });
    expect(await publishJob.runStep('release-tag', [], actions)).toBe(0);
    expect(record.outputs).toEqual({ tag: 'latest' });
    expect(record.logs).toEqual(['Publishing 21.0.0 under latest.']);
  });

  it('publishes an older major to its lts tag and says what outranks it', async () => {
    const { actions, record } = fakeActions({ version: '20.1.1', distTagReads: [{ latest: '21.0.0' }], gitTags: [...tagsAfter21, '20.1.1'] });
    expect(await publishJob.runStep('release-tag', [], actions)).toBe(0);
    expect(record.outputs).toEqual({ tag: 'v20-lts' });
    expect(record.logs).toEqual(['::warning::20.1.1 goes to v20-lts, not latest, because it does not rank above 21.0.0.', 'Publishing 20.1.1 under v20-lts.']);
  });

  it('publishes a prerelease to next', async () => {
    const { actions, record } = fakeActions({ version: '21.0.0-rc.2', distTagReads: [{ latest: '20.1.0', next: '21.0.0-rc.1' }], gitTags: tagsAfter21 });
    expect(await publishJob.runStep('release-tag', [], actions)).toBe(0);
    expect(record.outputs).toEqual({ tag: 'next' });
  });

  it('skips publishing on a re-run of a release npm already lists', async () => {
    const { actions, record } = fakeActions({ version: '21.0.0', distTagReads: [{ latest: '21.0.0', next: '21.0.0-rc.1' }] });
    expect(await publishJob.runStep('release-tag', [], actions)).toBe(0);
    expect(record.outputs).toEqual({ tag: 'latest', published: 'true' });
    expect(record.logs).toEqual(['npm already lists 21.0.0 as latest, so this run skips publishing it.']);
    const lts = fakeActions({ version: '20.1.1', distTagReads: [{ latest: '21.0.0', 'v20-lts': '20.1.1' }] });
    expect(await publishJob.runStep('release-tag', [], lts.actions)).toBe(0);
    expect(lts.record.outputs).toEqual({ tag: 'v20-lts', published: 'true' });
    const candidate = fakeActions({ version: '21.1.0-rc.0', distTagReads: [{ latest: '21.0.0', next: '21.1.0-rc.0' }] });
    expect(await publishJob.runStep('release-tag', [], candidate.actions)).toBe(0);
    expect(candidate.record.outputs).toEqual({ tag: 'next', published: 'true' });
  });

  it('fails without choosing a tag when the release must not publish', async () => {
    const { actions, record } = fakeActions({
      version: '20.0.4', distTagReads: [{ latest: '21.0.0', 'v20-lts': '20.1.1' }], gitTags: [...tagsAfter21, '20.1.1', '20.0.4'],
    });
    expect(await publishJob.runStep('release-tag', [], actions)).toBe(1);
    expect(record.outputs).toEqual({});
    expect(record.logs).toEqual(['::error::Not publishing 20.0.4 under v20-lts, because it does not rank above 20.1.1, 20.1.0.']);
  });

  it('fails when npm cannot be read', async () => {
    const { actions, record } = fakeActions({ version: '21.0.0', distTagReads: [unreadable(distTagsUrl)], gitTags: tagsAfter21 });
    expect(await publishJob.runStep('release-tag', [], actions)).toBe(1);
    expect(record.logs).toEqual([`::error::Could not read ${distTagsUrl}: fetch failed (ENOTFOUND).`]);
  });
});

describe('publish-job.js wait', () => {
  const stale = { latest: '20.1.0', canary: '21.0.1-canary.1' };
  const listed = { latest: '21.0.0', canary: '21.0.1-canary.1' };

  it('waits until npm lists the version under its tag', async () => {
    const { actions, record } = fakeActions({ version: '21.0.0', distTagReads: [stale, unreadable(distTagsUrl), listed] });
    expect(await publishJob.runStep('wait', ['latest'], actions)).toBe(0);
    expect(record.sleeps).toBe(2);
    expect(record.outputs).toEqual({ listed: 'true' });
    expect(record.logs).toEqual(['npm lists 21.0.0 as latest, 30s after publishing.']);
  });

  it('fails after 20 minutes for latest, printing the command that moves next', async () => {
    const { actions, record } = fakeActions({ version: '21.0.0', distTagReads: [stale] });
    expect(await publishJob.runStep('wait', ['latest'], actions)).toBe(1);
    expect(record.sleeps).toBe(80);
    expect(record.outputs).toEqual({});
    expect(record.logs[0]).toMatch(/^::warning::npm does not list 21\.0\.0 as latest 20 minutes after publishing/);
    expect(record.logs[1]).toBe('::error::next was not moved to 21.0.0. Once npm lists 21.0.0, publish rights are required to run: npm dist-tag add @angular/fire@21.0.0 next');
  });

  it('only warns after 20 minutes for any other tag', async () => {
    const { actions, record } = fakeActions({ version: '21.0.1-canary.2', distTagReads: [stale] });
    expect(await publishJob.runStep('wait', ['canary'], actions)).toBe(0);
    expect(record.outputs).toEqual({});
    expect(record.logs.length).toBe(1);
    expect(record.logs[0]).toMatch(/^::warning::/);
  });
});

describe('publish-job.js move-next', () => {

  it('moves next up to the release', async () => {
    const { actions, record } = fakeActions({ version: '21.0.0', distTagReads: [{ latest: '21.0.0', next: '21.0.0-rc.1' }] });
    expect(await publishJob.runStep('move-next', [], actions)).toBe(0);
    expect(record.commands).toEqual([moveNextCommand]);
  });

  it('leaves a higher next alone', async () => {
    const { actions, record } = fakeActions({ version: '21.0.1', distTagReads: [{ latest: '21.0.1', next: '21.1.0-rc.0' }] });
    expect(await publishJob.runStep('move-next', [], actions)).toBe(0);
    expect(record.commands).toEqual([]);
    expect(record.logs).toEqual(['Not moving next, because it is 21.1.0-rc.0.']);
  });

  it('prints the command that moves next on every failure', async () => {
    const fix = 'Publish rights are required to move it with: npm dist-tag add @angular/fire@21.0.0 next';
    const failures: [FakeActionsOptions, string][] = [
      [{ version: '21.0.0', distTagReads: [unreadable(distTagsUrl)] }, `::error::Could not read ${distTagsUrl}: fetch failed (ENOTFOUND). So next was not checked. ${fix}`],
      [{ version: '21.0.0', distTagReads: [{ latest: '21.0.0', next: '21.0.0-rc.1' }], npmFails: true }, `::error::21.0.0 is published, but next was not moved to it. ${fix}`],
    ];
    for (const [options, error] of failures) {
      const { actions, record } = fakeActions(options);
      expect(await publishJob.runStep('move-next', [], actions)).toBe(1);
      expect(record.logs).toEqual([error]);
    }
  });
});


describe('publish-job.js actions', () => {
  const git = (cwd: string, ...args: string[]) => execFileSync('git', ['-c', 'user.name=spec', '-c', 'user.email=spec@example.com', ...args], { cwd, encoding: 'utf8' }).trim();
  const envKeys = ['GITHUB_SERVER_URL', 'GITHUB_REPOSITORY', 'GITHUB_OUTPUT'];
  const savedEnv = envKeys.map(key => [key, process.env[key]]);
  const savedCwd = process.cwd();
  let workDir: string;
  let commits: string[];

  // A repository named `origin` with three commits on one line, tagged 21.0.0 and 21.0.1, plus an unrelated commit.
  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'publish-job-'));
    const origin = join(workDir, 'origin');
    git(workDir, 'init', '--quiet', 'origin');
    commits = ['one', 'two', 'three'].map(message => {
      git(origin, 'commit', '--quiet', '--allow-empty', '-m', message);
      return git(origin, 'rev-parse', 'HEAD');
    });
    git(origin, 'tag', '21.0.0', commits[0]);
    git(origin, 'tag', '-a', '21.0.1', '-m', 'annotated', commits[1]);
    git(origin, 'checkout', '--quiet', '--orphan', 'unrelated');
    git(origin, 'commit', '--quiet', '--allow-empty', '-m', 'unrelated');
    commits.push(git(origin, 'rev-parse', 'HEAD'));
    // A file:// address makes git honor --filter, as it does for the real repository.
    process.env.GITHUB_SERVER_URL = `file://${workDir}`;
    process.env.GITHUB_REPOSITORY = 'origin';
    process.env.GITHUB_OUTPUT = join(workDir, 'output');
    process.chdir(workDir);
  });

  afterEach(() => {
    process.chdir(savedCwd);
    for (const [key, value] of savedEnv) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    fsExtra.removeSync(workDir);
  });

  it('lists the repository\'s tag names', () => {
    expect(publishJob.actions.gitTags().sort()).toEqual(['21.0.0', '21.0.1']);
  });

  it('resolves abbreviations and orders commits in the cloned history', () => {
    publishJob.actions.cloneHistory();
    const [one, two, three, unrelated] = commits;
    expect(publishJob.actions.resolveCommit(three.slice(0, 7))).toBe(three);
    expect(() => publishJob.actions.resolveCommit('0000000')).toThrow();
    expect([publishJob.actions.isAncestor(one, three), publishJob.actions.isAncestor(three, two), publishJob.actions.isAncestor(one, unrelated)]).toEqual([true, false, false]);
  });

  it('appends step outputs as name=value lines', () => {
    writeFileSync(process.env.GITHUB_OUTPUT ?? '', '');
    publishJob.actions.setOutput('tag', 'latest');
    publishJob.actions.setOutput('listed', 'true');
    expect(readFileSync(process.env.GITHUB_OUTPUT ?? '', 'utf8')).toBe('tag=latest\nlisted=true\n');
  });
});
