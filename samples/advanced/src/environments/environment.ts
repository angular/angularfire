// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
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
  vapidKey: 'BIDPctnXHQDIjcOXxDS6qQcz-QTws7bL8v7UPgFnS1Ky5BZL3jS3-XXfxwRHmAUMOk7pXme7ttOBvVoIfX57PEo',
  recaptcha3SiteKey: '6LeI1VocAAAAAEHdUR_I_p2dDBkes4Hu7c5utbKT',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/plugins/zone-error'; // Included with Angular CLI.
