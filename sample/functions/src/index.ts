import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// @ts-ignore
export const ssr = require('ssr-functions').ssr;

export const yada = functions.https.onCall(() => {
    return { time: new Date().getTime() };
});
