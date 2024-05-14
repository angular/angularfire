import * as utils from './utils';

describe('utils', () => {

  describe('isString', () => {

    it('should be able to properly detect a string', () => {
      const str = 'oh hai';
      const notStr = 101;
      const bool = true;
      const nul = null;
      const obj = {};
      const fn = () => undefined;
      const undef = undefined;
      expect(utils.isString(str)).toBe(true);
      expect(utils.isString(notStr)).toBe(false);
      expect(utils.isString(bool)).toBe(false);
      expect(utils.isString(nul)).toBe(false);
      expect(utils.isString(obj)).toBe(false);
      expect(utils.isString(fn)).toBe(false);
      expect(utils.isString(undef)).toBe(false);
    });

  });

});
