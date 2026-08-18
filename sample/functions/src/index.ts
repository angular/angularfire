import { onCall } from "firebase-functions/https";

export const yada = onCall(() => {
    return { time: new Date().getTime() };
});
