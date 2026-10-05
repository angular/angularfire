const semver = require('semver');

/**
 * Picks the version a canary build is named after, as in `<base>-canary.<time>.sha-<sha>`.
 *
 * `ng add @angular/fire@canary` saves `^<canary>`, and npm installs the highest version in that
 * range, so the canary must rank above every release and release candidate already published
 * in its major.
 *
 * @param {string} packageVersion The `version` field of the repository's package.json.
 * @param {string[]} publishedVersions Every @angular/fire version on npm.
 * @returns {string} One patch above the highest published version of the same major, or the
 *   package.json version without its prerelease part if that is higher.
 */
function canaryBaseVersion(packageVersion, publishedVersions) {
  const packageBase = semver.coerce(packageVersion);
  // Published canaries don't count, or every canary would be named one patch above the one before it.
  const releases = publishedVersions.filter(
    version => !version.includes('canary') && semver.major(version) === packageBase.major,
  );
  const nextPatch = releases.length ? semver.coerce(semver.rsort(releases)[0]).inc('patch') : packageBase;
  return semver.gt(packageBase, nextPatch) ? packageBase.version : nextPatch.version;
}

module.exports = { canaryBaseVersion };

if (require.main === module) {
  console.log(canaryBaseVersion(process.argv[2], JSON.parse(process.argv[3])));
}
