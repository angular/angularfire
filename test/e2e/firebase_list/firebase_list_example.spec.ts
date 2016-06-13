import { waitForElement } from '../shared';

describe('FirebaseList', () => {
  it('should render', () => {
    browser.get('firebase_list/index.html');
    waitForElement('app');
    var app = $('app');
    browser.sleep(500);
    expect(app.getText()).toBe(`Hello
why?
how?`);
  });
});