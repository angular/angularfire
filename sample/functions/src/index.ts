import * as functions from 'firebase-functions';

// import * as admin from 'firebase-admin';
// admin.initializeApp();

// Increase readability in Cloud Logging
import 'firebase-functions/lib/logger/compat';

export const yada = functions.https.onCall(() => {
    return { time: new Date().getTime() };
});
