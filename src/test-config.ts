import { AuthMethods, AuthProviders } from './auth/index';

export const COMMON_CONFIG = {
  apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
  authDomain: "angularfire2-test.firebaseapp.com",
  databaseURL: "https://angularfire2-test.firebaseio.com",
  storageBucket: "angularfire2-test.appspot.com",
};

export const ANON_AUTH_CONFIG = {
  method: AuthMethods.Anonymous,
  provider: AuthProviders.Anonymous
};