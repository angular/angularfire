import {absolutePathResolver} from './absolute_path_resolver';
describe('absolutePathResolver', () => {
  it('should return fully qualified url for relative path', () => {
    var root = 'ws://test.firebaseio.com';
    var path = '/questions';
    expect(absolutePathResolver(root, path)).toBe(`${root}${path}`);
  })
});
