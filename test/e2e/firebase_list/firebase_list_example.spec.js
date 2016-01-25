/* global $ */
/* global element */
/* global browser */
describe('FirebaseList', () => {
  it('should render', () => {
    console.log('render test');
    browser.get('firebase_list/index.html');
    var app = $('app');
    expect(app.getText()).toBe('Hello');
  });
});