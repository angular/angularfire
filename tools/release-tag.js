// No dependencies: the publish job runs this without installing node_modules.
const STABLE = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const ANY = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;

/** Splits a version or tag into its three numbers and whether it is a prerelease. Throws if it is not semver. */
function parse(version) {
  const match = ANY.exec(version);
  if (!match) {
    throw new Error(`${version} is not a semver version.`);
  }
  return { numbers: match.slice(1, 4).map(Number), isPrerelease: !!match[4] };
}

/** Whether the stable `version` ranks above `other` in semver order. Only exact for a stable `version`. */
function isAbove(version, other) {
  const [mine, theirs] = [parse(version), parse(other)];
  for (let i = 0; i < 3; i++) {
    if (mine.numbers[i] !== theirs.numbers[i]) {
      return mine.numbers[i] > theirs.numbers[i];
    }
  }
  return theirs.isPrerelease;
}

/** Whether `tag` and `version` have the same three numbers, ignoring a `v` prefix and any prerelease part. */
const sameRelease = (tag, version) => parse(tag).numbers.join('.') === parse(version).numbers.join('.');

/**
 * Picks the npm dist-tag a tagged release publishes under.
 *
 * A stable version goes to `latest` only if it ranks above both npm's `latest` and every other
 * stable git tag, since a higher release can be tagged and still be in npm's publish-time malware scan.
 * Any other stable version goes to `v<major>-lts`, and must rank above that tag's current version.
 *
 * @param {string} version The version being published.
 * @param {Record<string, string>} distTags npm's current dist-tags.
 * @param {string[]} gitTags Every tag name in the repository.
 * @returns {string} The dist-tag. Throws if the version must not be published.
 */
function releaseTag(version, distTags, gitTags) {
  if (!STABLE.test(version)) {
    parse(version);
    return 'next';
  }
  if (releasesAbove(version, distTags, gitTags).length === 0) {
    return 'latest';
  }
  const major = parse(version).numbers[0];
  const ltsTag = `v${major}-lts`;
  const sameMajorReleases = gitTags.filter(tag => STABLE.test(tag) && !sameRelease(tag, version) && parse(tag).numbers[0] === major);
  const blocking = [distTags[ltsTag], ...sameMajorReleases].filter(release => release && !isAbove(version, release));
  if (blocking.length) {
    throw new Error(`Not publishing ${version} under ${ltsTag}, because it does not rank above ${[...new Set(blocking)].join(', ')}.`);
  }
  return ltsTag;
}

/**
 * The dist-tag npm already lists `version` under, preferring `latest`, which means this run is a
 * re-run of a published release.
 */
function publishedUnder(version, distTags) {
  return distTags.latest === version ? 'latest' : Object.keys(distTags).find(tag => distTags[tag] === version);
}

/** The highest of npm's `latest` and the other stable git tags that `version` does not rank above. */
function highestReleaseAbove(version, distTags, gitTags) {
  return releasesAbove(version, distTags, gitTags).reduce((highest, release) => (isAbove(release, highest) ? release : highest));
}

/** npm's `latest` and the other stable git tags that `version` does not rank above. */
function releasesAbove(version, distTags, gitTags) {
  const otherReleases = gitTags.filter(tag => STABLE.test(tag) && !sameRelease(tag, version));
  return [...new Set([distTags.latest, ...otherReleases])].filter(release => !isAbove(version, release));
}

/** Whether a published release should become `next`: it is stable and above npm's `next`. */
function movesNext(version, distTags) {
  return STABLE.test(version) && (!distTags.next || isAbove(version, distTags.next));
}

module.exports = { highestReleaseAbove, movesNext, publishedUnder, releasesAbove, releaseTag };
