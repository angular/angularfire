export const defaultPackage = `{
  "name": "functions",
  "description": "Angular Universal Application",
  "scripts": {
    "lint": "",
    "serve": "firebase serve --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "8"
  },
  "dependencies": {
    "firebase-admin": "~7.0.0",
    "firebase-functions": "^2.3.0"
  },
  "devDependencies": {
    "firebase-functions-test": "^0.1.6"
  },
  "private": true
}
`;

export const defaultFunction = (path: string) => `const functions = require('firebase-functions');

exports.ssr = functions.https.onRequest(require('./${path}/main').app());
`;
