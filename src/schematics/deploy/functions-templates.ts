export const NodeVersion = 10;

export const defaultPackage = (
  firebaseAdminVersion: string,
  firebaseFunctionsVersion: string,
  firebaseFunctionsTestVersion: string
) => `{
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
    "node": "${NodeVersion}"
  },
  "dependencies": {
    "firebase-admin": "${firebaseAdminVersion}",
    "firebase-functions": "${firebaseFunctionsVersion}"
  },
  "devDependencies": {
    "firebase-functions-test": "${firebaseFunctionsTestVersion}"
  },
  "private": true
}
`;

export const defaultFunction = (
  path: string
) => `const functions = require('firebase-functions');

exports.ssr = functions.https.onRequest(require('./${path}/main').app());
`;
