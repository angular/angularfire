import { onCall } from "firebase-functions/v2/https";

export const foo = onCall(() => {
    return { bar: "baz" };
});
