import { gt as semverGt } from 'semver';
import { highestReleaseAbove, movesNext, publishedUnder, releasesAbove, releaseTag } from './release-tag.js';
import 'jasmine';

/* npm's dist-tags and the repository's stable tags once 21.0.0 ships. */
const after21 = { latest: '21.0.0', next: '21.0.0', canary: '21.0.1-canary.20261005034752.sha-bc3fdad' };
const tagsAfter21 = ['5.1', 'v5.2.0', '20.0.3', '20.1.0', '21.0.0-rc.1', '21.0.0'];

describe('releaseTag', () => {

  it('publishes a new major to latest', () => {
    const today = { latest: '20.1.0', next: '21.0.0-rc.1' };
    expect(releaseTag('21.0.0', today, ['20.0.3', '20.1.0', '21.0.0-rc.1', '21.0.0'])).toBe('latest');
  });

  it('publishes a patch, minor or major above latest to latest', () => {
    expect(releaseTag('21.0.1', after21, [...tagsAfter21, '21.0.1'])).toBe('latest');
    expect(releaseTag('21.1.0', after21, [...tagsAfter21, '21.1.0'])).toBe('latest');
    expect(releaseTag('22.0.0', after21, [...tagsAfter21, '22.0.0'])).toBe('latest');
  });

  it('compares each number, not the version text', () => {
    const at21dot9 = { latest: '21.9.0' };
    expect(releaseTag('21.10.0', at21dot9, ['21.9.0', '21.10.0'])).toBe('latest');
    expect(() => releaseTag('21.9.1', { latest: '21.10.0' }, ['21.10.0', '21.9.1'])).toThrowError(/does not rank above 21\.10\.0\.$/);
  });

  it('publishes an older major to its lts tag', () => {
    expect(releaseTag('20.1.1', after21, [...tagsAfter21, '20.1.1'])).toBe('v20-lts');
  });

  it('publishes to the lts tag while a higher tagged release is still in npm\'s scan', () => {
    const stillScanning = { latest: '20.1.0', next: '21.0.0-rc.1' };
    expect(releaseTag('20.1.1', stillScanning, [...tagsAfter21, '20.1.1'])).toBe('v20-lts');
  });

  it('publishes a later patch to an existing lts tag', () => {
    const withLts = { ...after21, 'v20-lts': '20.1.1' };
    expect(releaseTag('20.1.2', withLts, [...tagsAfter21, '20.1.1', '20.1.2'])).toBe('v20-lts');
  });

  it('ignores prerelease tags above the release', () => {
    expect(releaseTag('21.0.1', after21, [...tagsAfter21, '21.1.0-rc.0', '22.0.0-next.0', '21.0.1'])).toBe('latest');
  });

  it('refuses a release below the current lts version', () => {
    const withLts = { ...after21, 'v20-lts': '20.1.1' };
    expect(() => releaseTag('20.0.4', withLts, [...tagsAfter21, '20.1.1', '20.0.4'])).toThrowError(/does not rank above 20\.1\.1/);
    expect(() => releaseTag('20.1.1', withLts, [...tagsAfter21, '20.1.1'])).toThrowError(/does not rank above 20\.1\.1/);
  });

  it('refuses the first lts release of a major below another release of that major', () => {
    expect(() => releaseTag('20.0.4', after21, [...tagsAfter21, '20.0.4'])).toThrowError('Not publishing 20.0.4 under v20-lts, because it does not rank above 20.1.0.');
  });

  it('publishes every prerelease to next', () => {
    expect(releaseTag('21.1.0-rc.0', after21, tagsAfter21)).toBe('next');
    expect(releaseTag('20.2.0-rc.0', after21, tagsAfter21)).toBe('next');
    expect(releaseTag('22.0.0-next.0', after21, tagsAfter21)).toBe('next');
    expect(releaseTag('22.0.0-alpha.1', after21, tagsAfter21)).toBe('next');
  });

  it('refuses versions it cannot read', () => {
    expect(() => releaseTag('21.0', after21, tagsAfter21)).toThrowError(/not a semver version/);
    expect(() => releaseTag('21.0.0-', after21, tagsAfter21)).toThrowError(/not a semver version/);
  });

  it('ranks stable versions exactly as semver does', () => {
    const others = ['20.9.9', '21.0.0-rc.1', '21.0.0', '21.0.1-rc.0', '21.0.1', '21.0.2', '21.1.0-rc.0', '21.1.0', '21.10.0', '22.0.0-canary.1'];
    for (const version of ['21.0.0', '21.0.1', '21.1.0', '21.9.0', '21.10.0']) {
      for (const other of others) {
        const expected = semverGt(version, other) ? 'latest' : 'v21-lts';
        expect(`${version} over ${other}: ${releaseTag(version, { latest: other }, [version])}`)
          .toBe(`${version} over ${other}: ${expected}`);
      }
    }
  });
});

describe('movesNext', () => {

  // By the time this runs, npm's `latest` is already the release.
  it('moves next up to a stable release', () => {
    expect(movesNext('21.0.0', { latest: '21.0.0', next: '21.0.0-rc.1' })).toBeTrue();
    expect(movesNext('21.0.1', { latest: '21.0.1', next: '21.0.0' })).toBeTrue();
    expect(movesNext('21.0.1', { latest: '21.0.1', next: '21.0.1-rc.0' })).toBeTrue();
  });

  it('moves next when npm has none', () => {
    expect(movesNext('21.0.0', { latest: '21.0.0' })).toBeTrue();
  });

  it('leaves next on a higher version', () => {
    expect(movesNext('21.0.1', { latest: '21.0.1', next: '21.1.0-rc.0' })).toBeFalse();
    expect(movesNext('21.0.0', { latest: '21.0.0', next: '21.0.0' })).toBeFalse();
  });

  it('never moves next to a prerelease', () => {
    expect(movesNext('21.1.0-rc.0', { latest: '21.0.0', next: '21.0.0' })).toBeFalse();
  });
});

describe('publishedUnder', () => {

  it('is undefined for a version npm does not list', () => {
    expect(publishedUnder('21.0.1', after21)).toBeUndefined();
  });

  it('names the dist-tag that holds the version, preferring latest', () => {
    expect(publishedUnder('21.0.0', { next: '21.0.0', latest: '21.0.0' })).toBe('latest');
    expect(publishedUnder('20.1.1', { latest: '21.0.0', 'v20-lts': '20.1.1' })).toBe('v20-lts');
  });
});

describe('highestReleaseAbove', () => {

  it('names only the highest release the version does not rank above', () => {
    const tags = [...tagsAfter21, '22.0.0', '22.6.3', '22.1.0', '21.0.1'];
    expect(highestReleaseAbove('21.0.1', { latest: '22.0.0' }, tags)).toBe('22.6.3');
    expect(highestReleaseAbove('20.1.1', { latest: '20.1.0' }, [...tagsAfter21, '21.1.0', '20.1.1'])).toBe('21.1.0');
  });
});

describe('releasesAbove', () => {

  it('lists npm\'s latest and the stable git tags the release does not rank above, once each', () => {
    expect(releasesAbove('20.1.1', after21, [...tagsAfter21, '20.1.1'])).toEqual(['21.0.0']);
    expect(releasesAbove('21.0.2', after21, [...tagsAfter21, '21.1.0', '21.0.2'])).toEqual(['21.1.0']);
    expect(releasesAbove('21.0.1', after21, [...tagsAfter21, '21.1.0-rc.0', '21.0.1'])).toEqual([]);
  });
});
