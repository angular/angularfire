// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  useEmulators: false,
  production: false,
  firebase: {
    apiKey: 'AIzaSyA7CNE9aHbcSEbt9y03QReJ-Xr0nwKg7Yg',
    authDomain: 'aftest-94085.firebaseapp.com',
    databaseURL: 'https://aftest-94085.firebaseio.com',
    projectId: 'aftest-94085',
    storageBucket: 'aftest-94085.appspot.com',
    messagingSenderId: '480362569154',
    appId: '1:480362569154:web:2fe6f75104cdfb82f50a5b',
    measurementId: 'G-CBRYER9PJR'
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
