import * as functions from 'firebase-functions';

export const yada = functions.https.onCall(() => {
    return { time: new Date().getTime() };
});
