import {absolutePathResolver} from './absolute_path_resolver';
describe('absolutePathResolver', () => {
  it('should return fully qualified url for relative path', () => {
    var root = 'ws://localhost.firebaseio.test:5000';
    var path = '/questions';
    expect(absolutePathResolver(root, path)).toBe(`${root}${path}`);
  })
});
