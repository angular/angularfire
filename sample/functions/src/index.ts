import * as functions from 'firebase-functions';

// Increase readability in Cloud Logging
import 'firebase-functions/lib/logger/compat';

export const yada = functions.https.onCall(() => {
    return { time: new Date().getTime() };
});
