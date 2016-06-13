export function waitForElement(selector: string) {
  var EC = (protractor).ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}