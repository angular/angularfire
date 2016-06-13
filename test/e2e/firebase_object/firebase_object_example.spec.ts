import { waitForElement } from '../shared';

describe('FirebaseObject', () => {
  it('should render', () => {
    browser.get('firebase_object/index.html');
    waitForElement('app');
    var app = $('app');
    browser.sleep(500);
    expect(app.getText()).toBe(`Question
how to firebase?`);
  });
});