// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  useEmulators: true,
  production: false,
  firebase: {
    apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
    authDomain: "angularfire2-test.firebaseapp.com",
    databaseURL: "https://angularfire2-test.firebaseio.com",
    projectId: "angularfire2-test",
    storageBucket: "angularfire2-test.appspot.com",
    messagingSenderId: "920323787688",
    appId: "1:920323787688:web:2253a0e5eb5b9a8b",
    measurementId: "G-W20QDV5CZP"
  },
  vapidKey: 'BObYLml9CWDGcaj2xQTv6MwjS-R5mRyTlCbfTpflWy3iGHEMTyIhhd0FN6VIFszPoVzwEL_gm7o9ISxpotwKHfE',
  recaptcha3SiteKey: '6LchwAoqAAAAAMfT_hY2nwI1WXJcBE20DGA_k-A3',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/plugins/zone-error'; // Included with Angular CLI.
