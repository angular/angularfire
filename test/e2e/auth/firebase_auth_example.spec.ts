import { waitForElement } from '../shared';

describe('FirebaseList', () => {
  it('should login anonymously', () => {
    browser.get('auth/index.html');
    waitForElement('#is-anonymous');
    var isAnonymous = $('#is-anonymous');
    expect(isAnonymous.getText()).toBe('');
    var login = $('#login-anonymous');
    login.click();
    browser.sleep(1000);
    expect(isAnonymous.getText()).toBe('true');
  });
});
