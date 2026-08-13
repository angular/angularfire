import { DEFAULT_NODE_VERSION, defaultFunction, defaultPackage } from './functions-templates.js';
import 'jasmine';

describe('functions templates', () => {
  describe('defaultFunction', () => {
    it('requires the firebase-functions/v1 subpath, where the v1 API lives on firebase-functions 6', () => {
      const generated = defaultFunction('dist/app', {}, undefined);
      expect(generated).toContain(`require('firebase-functions/v1')`);
      expect(generated).not.toContain(`require('firebase-functions')`);
    });
  });

  describe('defaultPackage', () => {
    it('defaults engines.node to a runtime Cloud Functions still accepts', () => {
      const generated = defaultPackage({}, {}, {});
      expect(generated.engines.node).toBe(DEFAULT_NODE_VERSION.toString());
      expect(DEFAULT_NODE_VERSION).toBe(22);
    });
  });
});
