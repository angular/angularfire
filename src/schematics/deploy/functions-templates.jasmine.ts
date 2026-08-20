import { DEFAULT_NODE_VERSION, defaultFunction, defaultPackage } from './functions-templates.js';
import 'jasmine';

describe('functions templates', () => {
  describe('defaultFunction', () => {
    it('requires the firebase-functions/v1 subpath, where the v1 API lives on firebase-functions 6', () => {
      const generated = defaultFunction('dist/app', {}, undefined);
      expect(generated).toContain(`require('firebase-functions/v1')`);
      expect(generated).not.toContain(`require('firebase-functions')`);
    });

    it('escapes region rather than interpolating it into a string literal', () => {
      const region = `us-central1'); require('child_process').execSync('id'); ('`;
      const generated = defaultFunction('dist/app', { region }, undefined);
      expect(generated).toContain(`.region(${JSON.stringify(region)})`);
      // Interpolated raw, the payload closes `.region('` and the require becomes a statement
      // of its own. Escaped, it changes nothing but that one argument, so swapping it back
      // out has to reproduce the benign render exactly.
      expect(generated.replace(JSON.stringify(region), JSON.stringify('us-central1')))
        .toBe(defaultFunction('dist/app', { region: 'us-central1' }, undefined));
    });
  });

  describe('defaultPackage', () => {
    it('defaults engines.node to a runtime Cloud Functions still accepts', () => {
      const generated = defaultPackage({}, {}, {});
      expect(generated.engines.node).toBe(DEFAULT_NODE_VERSION.toString());
      expect(DEFAULT_NODE_VERSION).toBe(22);
    });

    it('quotes the start script path, which a shell would otherwise split or expand', () => {
      // `main` carries a build target's outputPath, and the Cloud Run image runs this
      // through `npm start`.
      expect(defaultPackage({}, {}, {}, 'dist/my app/main.js').scripts.start)
        .toBe('node "dist/my app/main.js"');
      expect(defaultPackage({}, {}, {}, 'dist/[ab]/main.js').scripts.start)
        .toBe('node "dist/[ab]/main.js"');
    });

    it('falls back to the functions shell when there is no main', () => {
      expect(defaultPackage({}, {}, {}).scripts.start).toBe('firebase functions:shell');
    });
  });
});
