/* global $ */
/* global element */
/* global browser */
describe('FirebaseList', () => {
  it('should render', () => {
    console.log('render test');
    browser.get('firebase_list/index.html');
    var heading = $('h1');
    expect(heading.getText()).toBe('Hi');
  });
});