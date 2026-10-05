import { maxSatisfying as semverMaxSatisfying } from 'semver';
import { canaryBaseVersion } from './canary-version.js';
import 'jasmine';

/* What's on npm today: a placeholder, v20 releases, rc.1, canaries named after the rc series
 * (deprecated), and canaries named after 21.0.0. */
const publishedToday = [
  '0.0.0',
  '20.0.0',
  '20.1.0',
  '21.0.0-rc.0',
  '21.0.0-rc.0-canary.fb6796b',
  '21.0.0-rc.1',
  '21.0.0-rc.1-canary.95b3de1',
  '21.0.0-canary.a2662fe',
  '21.0.0-canary.20260930011755.sha-59d44e7',
];

const canaryNamedAfter = (base: string) => `${base}-canary.20261001000000.sha-abcdef0`;

describe('canaryBaseVersion', () => {

  it('names the canary one patch above the release candidate', () => {
    expect(canaryBaseVersion('21.0.0', publishedToday)).toBe('21.0.1');
  });

  it('names the canary one patch above the release once it ships', () => {
    expect(canaryBaseVersion('21.0.0', [...publishedToday, '21.0.0'])).toBe('21.0.1');
    expect(canaryBaseVersion('21.0.0', [...publishedToday, '21.0.0', '21.0.1'])).toBe('21.0.2');
  });

  it('names the canary above a minor or patch release candidate', () => {
    expect(canaryBaseVersion('21.0.0', [...publishedToday, '21.0.0', '21.1.0-rc.0'])).toBe('21.1.1');
    expect(canaryBaseVersion('21.0.0', [...publishedToday, '21.0.0', '21.0.1-rc.0'])).toBe('21.0.2');
  });

  it('does not count earlier canaries', () => {
    const published = [...publishedToday, canaryNamedAfter('21.0.1'), canaryNamedAfter('21.0.1')];
    expect(canaryBaseVersion('21.0.0', published)).toBe('21.0.1');
  });

  it('ignores releases from other majors', () => {
    expect(canaryBaseVersion('21.0.0', [...publishedToday, '21.0.0', '20.0.4'])).toBe('21.0.1');
    expect(canaryBaseVersion('21.0.0', [...publishedToday, '21.0.0', '22.0.0-rc.0'])).toBe('21.0.1');
  });

  it('uses the package.json version when nothing in its major is published yet', () => {
    expect(canaryBaseVersion('22.0.0-rc.0', publishedToday)).toBe('22.0.0');
    expect(canaryBaseVersion('22.0.0-rc.0', [...publishedToday, '22.0.0-rc.0'])).toBe('22.0.1');
  });

  it('throws when the package.json version has no version number in it', () => {
    expect(() => canaryBaseVersion('abc', publishedToday)).toThrowError(TypeError);
  });

  it('gives a canary that its own caret range selects, and that release ranges never select', () => {
    const states = [
      publishedToday,
      [...publishedToday, '21.0.0'],
      [...publishedToday, '21.0.0', '21.0.1'],
      [...publishedToday, '21.0.0', '21.1.0-rc.0'],
      [...publishedToday, '21.0.0', '21.0.1-rc.0'],
    ];
    for (const published of states) {
      const canary = canaryNamedAfter(canaryBaseVersion('21.0.0', published));
      const versions = [...published, canary];
      expect(semverMaxSatisfying(versions, `^${canary}`)).toBe(canary);
      for (const range of ['^21.0.0', '~21.0.0', '^21.0.0-rc.1', '^20.0.0']) {
        expect(semverMaxSatisfying(versions, range)).not.toBe(canary);
      }
    }
  });

});
