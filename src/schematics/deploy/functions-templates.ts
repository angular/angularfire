// TODO allow these to be configured
export const NodeVersion = 10;
const FUNCTION_NAME = 'ssr';
const FUNCTION_REGION = 'us-central1';
const RUNTIME_OPTIONS = {
  timeoutSeconds: 60,
  memory: '1GB'
}

export const defaultPackage = (
  dependencies: {[key:string]: string},
  devDependencies: {[key:string]: string}
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
  "dependencies": ${JSON.stringify(dependencies, null, 4)},
  "devDependencies": ${JSON.stringify(devDependencies, null, 4)},
  "private": true
}
`;

export const defaultFunction = (
  path: string
) => `const functions = require('firebase-functions');

const expressApp = require('./${path}/main').app();

exports.${FUNCTION_NAME} = functions
  .region('${FUNCTION_REGION}')
  .runWith(${JSON.stringify(RUNTIME_OPTIONS)})
  .https
  .onRequest(expressApp);
`;
