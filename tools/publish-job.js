// No dependencies: the publish job runs this without installing node_modules.
const { execFileSync } = require('child_process');
const { appendFileSync, readFileSync } = require('fs');
const { highestReleaseAbove, movesNext, publishedUnder, releaseTag } = require('./release-tag.js');

const DIST_TAGS_URL = 'https://registry.npmjs.org/-/package/@angular/fire/dist-tags';
const WOMBAT_URL = 'https://wombat-dressing-room.appspot.com';
// npm lists a version only after its publish-time malware scan.
const WAIT_SECONDS = 1200;
const POLL_SECONDS = 15;

/** Reads npm's dist-tags from the endpoint npm does not CDN-cache, unlike the package data `npm view` reads. */
async function fetchDistTags() {
  let lastError;
  for (const pauseSeconds of [0, 2, 4]) {
    await new Promise(resolve => setTimeout(resolve, pauseSeconds * 1000));
    try {
      const response = await fetch(DIST_TAGS_URL, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) {
        throw new Error(`it answered ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  const reason = lastError.cause ? `${lastError.message} (${lastError.cause.code ?? lastError.cause.message})` : lastError.message;
  throw new Error(`Could not read ${DIST_TAGS_URL}: ${reason}.`);
}

const git = (args, options) => execFileSync('git', args, options);
const repositoryUrl = () => `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`;

/** The npm, git, file, clock and log calls the steps make on the GitHub Actions runner. */
const actions = {
  version: () => JSON.parse(readFileSync('dist/packages-dist/package.json', 'utf8')).version,
  fetchDistTags,
  gitTags: () => git(['ls-remote', '--tags', '--refs', repositoryUrl()], { encoding: 'utf8' })
    .split('\n').filter(line => line).map(line => line.replace(/.*refs\/tags\//, '')),
  run: (command, args) => execFileSync(command, args, { stdio: 'inherit' }),
  commit: () => process.env.GITHUB_SHA,
  cloneHistory: () => git(['clone', '--quiet', '--bare', '--filter=tree:0', repositoryUrl(), 'history.git']),
  resolveCommit: abbreviation => git(['-C', 'history.git', 'rev-parse', '--verify', '--quiet', `${abbreviation}^{commit}`], { encoding: 'utf8' }).trim(),
  isAncestor: (ancestor, descendant) => {
    try {
      git(['-C', 'history.git', 'merge-base', '--is-ancestor', ancestor, descendant]);
      return true;
    } catch {
      return false;
    }
  },
  sleep: seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000)),
  now: () => Date.now(),
  setOutput: (name, value) => appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`),
  log: message => console.log(message),
};

/**
 * Sets the step output `skip` for a canary whose commit is not after the commit of the canary on
 * npm, since `npm publish` always moves the dist-tag. Ordered by position on main, not by version,
 * which can be higher for an older commit.
 */
async function checkCanary(actions) {
  const version = actions.version();
  const npmCanary = (await actions.fetchDistTags()).canary;
  actions.cloneHistory();
  const commit = actions.commit();
  const howToFix = 'Every canary publish fails until the canary dist-tag points at a build of a commit on main. Publish rights are required to fix it with: npm dist-tag add @angular/fire@<version> canary';

  let npmCanaryCommit;
  try { npmCanaryCommit = actions.resolveCommit(npmCanary.split(/[.-]/).pop()); }
  catch { throw new Error(`Could not match the canary on npm, ${npmCanary}, to a single commit in this repository. ${howToFix}`); }

  if (npmCanaryCommit === commit) {
    if (version === npmCanary) {
      actions.log(`::notice::Not publishing ${version}, because it is already the canary on npm.`);
      actions.setOutput('skip', 'true');
    }
  } else if (actions.isAncestor(commit, npmCanaryCommit)) {
    actions.log(`::warning::Not publishing ${version}, because the canary on npm, ${npmCanary}, is from a later commit on main.`);
    actions.setOutput('skip', 'true');
  } else if (!actions.isAncestor(npmCanaryCommit, commit)) {
    throw new Error(`Not publishing ${version}, because its commit and the commit of the canary on npm, ${npmCanary}, are not on the same line of history. One of them is not on main. ${howToFix}`);
  }
}

/**
 * Chooses the dist-tag a tagged release publishes under and sets the step output `tag`. On a re-run
 * of a release npm already lists, also sets `published`, so the job skips `npm publish` and goes on
 * to the steps after it.
 */
async function chooseReleaseTag(actions) {
  const version = actions.version();
  const distTags = await actions.fetchDistTags();
  const alreadyUnder = publishedUnder(version, distTags);
  if (alreadyUnder) {
    actions.log(`npm already lists ${version} as ${alreadyUnder}, so this run skips publishing it.`);
    actions.setOutput('tag', alreadyUnder);
    actions.setOutput('published', 'true');
    return;
  }
  // A higher release can be tagged and still be in npm's publish-time malware scan, so git tags count too.
  const gitTags = actions.gitTags();
  const tag = releaseTag(version, distTags, gitTags);
  if (tag.endsWith('-lts')) {
    actions.log(`::warning::${version} goes to ${tag}, not latest, because it does not rank above ${highestReleaseAbove(version, distTags, gitTags)}.`);
  }
  actions.log(`Publishing ${version} under ${tag}.`);
  actions.setOutput('tag', tag);
}

/**
 * Waits until npm lists the published version under `tag`, holding the publish queue so the next
 * publish reads it, and sets the step output `listed`. Fails on timeout only for `latest`, since
 * `next` then cannot be moved.
 */
async function waitUntilListed(actions, tag) {
  const version = actions.version();
  const start = actions.now();
  while (actions.now() - start < WAIT_SECONDS * 1000) {
    const distTags = await actions.fetchDistTags().catch(() => ({}));
    if (distTags[tag] === version) {
      actions.log(`npm lists ${version} as ${tag}, ${Math.round((actions.now() - start) / 1000)}s after publishing.`);
      actions.setOutput('listed', 'true');
      return;
    }
    await actions.sleep(POLL_SECONDS);
  }
  actions.log(`::warning::npm does not list ${version} as ${tag} ${WAIT_SECONDS / 60} minutes after publishing, so the next publish may read the previous ${tag}.`);
  if (tag === 'latest') {
    throw new Error(`next was not moved to ${version}. Once npm lists ${version}, publish rights are required to run: npm dist-tag add @angular/fire@${version} next`);
  }
}

/** Moves `next` up to a release npm now lists as `latest`, unless `next` is already higher. */
async function moveNext(actions) {
  const version = actions.version();
  const fix = `Publish rights are required to move it with: npm dist-tag add @angular/fire@${version} next`;

  let distTags;
  try { distTags = await actions.fetchDistTags(); }
  catch (error) { throw new Error(`${error.message} So next was not checked. ${fix}`); }

  if (!movesNext(version, distTags)) {
    actions.log(`Not moving next, because it is ${distTags.next}.`);
    return;
  }

  try { actions.run('npm', ['dist-tag', 'add', `@angular/fire@${version}`, 'next', '--registry', WOMBAT_URL]); }
  catch { throw new Error(`${version} is published, but next was not moved to it. ${fix}`); }
}

const steps = {
  'canary-check': actions => checkCanary(actions),
  'release-tag': actions => chooseReleaseTag(actions),
  'wait': (actions, tag) => waitUntilListed(actions, tag),
  'move-next': actions => moveNext(actions),
};

/** Runs one step, turning a thrown error into an `::error::` line and exit code 1. */
async function runStep(name, args, actions) {
  try {
    await steps[name](actions, ...args);
    return 0;
  } catch (error) {
    actions.log(`::error::${error.message}`);
    return 1;
  }
}

if (require.main === module) {
  const [name, ...args] = process.argv.slice(2);
  runStep(name, args, actions).then(code => process.exit(code));
}

module.exports = { actions, runStep };
