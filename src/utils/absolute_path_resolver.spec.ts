import {absolutePathResolver} from './absolute_path_resolver';
describe('absolutePathResolver', () => {
  it('should return fully qualified url for relative path', () => {
    var root = 'https://angularfire2.firebaseio-demo.com/';
    var path = '/questions';
    expect(absolutePathResolver(root, path)).toBe(`${root}${path}`);
  })
});
