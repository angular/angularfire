/* global protractor */
/* global $ */
/* global element */
/* global browser */
function waitForElement(selector) {
  var EC = (protractor).ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

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