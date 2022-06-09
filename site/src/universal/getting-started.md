---
title: Getting started
eleventyNavigation:
  key: Getting started
  parent: Universal
---

## Getting started with AngularFire and Universal

Server-side rendering (SSR) is the process of converting a JavaScript app to plain HTML at request-time, allowing search engine crawlers and linkbots to understand page content reliably. 

## Prerequisites

- `@angular/cli >= v6.0`
- `@angular/fire >= v5.0.0`

## Generate the Angular Universal Server Module

First, create a server module with the Angular CLI.

```bash
ng generate universal --client-project <your-project>
```

## Build a Server with ExpressJS

[ExpressJS](https://expressjs.com/) is a lightweight web framework that can serve http requests in Node. First, install the dev dependencies:

```bash
npm install --save-dev @nguniversal/express-engine @nguniversal/module-map-ngfactory-loader express webpack-cli ts-loader ws xhr2
```

Create a file called `server.ts` in the root of you project.

```ts
// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { enableProdMode } from '@angular/core';
import { ngExpressEngine } from '@nguniversal/express-engine';
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

import * as express from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';

// Polyfills required for Firebase
(global as any).WebSocket = require('ws');
(global as any).XMLHttpRequest = require('xhr2');

// Faster renders in prod mode
enableProdMode();

// Export our express server
export const app = express();

const DIST_FOLDER = join(process.cwd(), 'dist');
const APP_NAME = 'YOUR_PROJECT_NAME'; // TODO: replace me!

const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require(`./dist/${APP_NAME}-server/main`);

// index.html template
const template = readFileSync(join(DIST_FOLDER, APP_NAME, 'index.html')).toString();

app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP)
  ]
}));

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, APP_NAME));

// Serve static files 
app.get('*.*', express.static(join(DIST_FOLDER, APP_NAME)));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
    res.render(join(DIST_FOLDER, APP_NAME, 'index.html'), { req });
});

// If we're not in the Cloud Functions environment, spin up a Node server
if (!process.env.FUNCTION_NAME) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Node server listening on http://localhost:${PORT}`);
  });
}
```

## Add a Webpack Config for the Express Server

Create a new file named `webpack.server.config.js` to bundle the express app from previous step.


```js
const path = require('path');
const webpack = require('webpack');

const APP_NAME = 'YOUR_PROJECT_NAME'; // TODO: replace me!

module.exports = {
  entry: {  server: './server.ts' },
  resolve: { extensions: ['.js', '.ts'] },
  mode: 'development',
  target: 'node',
  externals: [
    /* Firebase has some troubles being webpacked when in
       in the Node environment, let's skip it.
       Note: you may need to exclude other dependencies depending
       on your project. */
    /^firebase/
  ],
  output: {
    // Export a UMD of the webpacked server.ts & deps, for
    // rendering in Cloud Functions
    path: path.join(__dirname, `dist/${APP_NAME}-webpack`),
    library: 'app',
    libraryTarget: 'umd',
    filename: '[name].js'
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  },
  plugins: [
    new webpack.ContextReplacementPlugin(
      /(.+)?angular(\\|\/)core(.+)?/,
      path.join(__dirname, 'src'), // location of your src
      {} // a map of your routes
    ),
    new webpack.ContextReplacementPlugin(
      /(.+)?express(\\|\/)(.+)?/,
      path.join(__dirname, 'src'),
      {}
    )
  ]
}
```

## Build Scripts

Update your `package.json` with the following build scripts, replacing `YOUR_PROJECT_NAME` with the name of your project.

```js
"scripts": {
  // ... omitted
  "build": "ng build && npm run build:ssr",
  "build:ssr": "ng run YOUR_PROJECT_NAME:server && npm run webpack:ssr",
  "webpack:ssr": "webpack --config webpack.server.config.js",
  "serve:ssr": "node dist/YOUR_PROJECT_NAME-webpack/server.js"
},
```

Test your app locally by running `npm run build && npm run serve:ssr`. 
