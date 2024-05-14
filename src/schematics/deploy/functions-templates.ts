import { DeployBuilderOptions } from './actions';

export const DEFAULT_NODE_VERSION = 14;
export const DEFAULT_FUNCTION_NAME = 'ssr';

const DEFAULT_FUNCTION_REGION = 'us-central1';

const DEFAULT_RUNTIME_OPTIONS = {
  timeoutSeconds: 60,
  memory: '1GB'
};

export const defaultPackage = (
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
  options: DeployBuilderOptions,
  main?: string,
) => ({
  name: 'functions',
  description: 'Angular Universal Application',
  main: main ?? 'index.js',
  scripts: {
    start: main ? `node ${main}` : 'firebase functions:shell',
  },
  engines: {
    node: (options.functionsNodeVersion || DEFAULT_NODE_VERSION).toString()
  },
  dependencies,
  devDependencies,
  private: true
});

export const defaultFunction = (
  path: string,
  options: DeployBuilderOptions,
  functionName: string|undefined,
) => `const functions = require('firebase-functions');

// Increase readability in Cloud Logging
require("firebase-functions/lib/logger/compat");

const expressApp = require('./${path}/main').app();

exports.${functionName || DEFAULT_FUNCTION_NAME} = functions
  .region('${options.region || DEFAULT_FUNCTION_REGION}')
  .runWith(${JSON.stringify(options.functionsRuntimeOptions || DEFAULT_RUNTIME_OPTIONS)})
  .https
  .onRequest(expressApp);
`;

export const functionGen2 = (
  path: string,
  options: DeployBuilderOptions,
  functionName: string|undefined,
) => `const { onRequest } = require('firebase-functions/v2/https');

// Increase readability in Cloud Logging
require("firebase-functions/lib/logger/compat");

const expressApp = require('./${path}/main').app();

exports.${functionName || DEFAULT_FUNCTION_NAME} = onRequest(${JSON.stringify({
  region: options.region || DEFAULT_FUNCTION_REGION,
  ...(options.functionsRuntimeOptions || DEFAULT_RUNTIME_OPTIONS)
})}, expressApp);
`;

export const dockerfile = (
  options: DeployBuilderOptions,
) => `FROM node:${options.functionsNodeVersion || DEFAULT_NODE_VERSION}-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . ./
CMD [ "npm", "start" ]
`;
