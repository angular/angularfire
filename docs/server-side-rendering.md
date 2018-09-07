# Server-side Rendering with Universal

Server-side rendering (SSR) is the process of converting a JavaScript app to plain HTML at request-time, allowing search engine crawlers and linkbots to understand page content reliably. 

## 0. Prerequisites

- @angular/cli >= v6.0
- angularfire2 >= v5.0.0-rc.7

## 1. Generate the Angular Universal Server Module

First, create a server module with the Angular CLI.

```
ng generate universal --client-project <your-project>
```

## 2. Build a Server with ExpressJS

[ExpressJS](https://expressjs.com/) is a lightweight web framework that can serve http requests in Node. First, install the dev dependencies:

```
npm install --save-dev express webpack-cli ts-loader ws xmlhttprequest
```

Create a file called `server.ts` in the root of you project.

```ts
// These are important and needed before anything else
import 'zone.js/dist/zone-node';
import 'reflect-metadata';

import { renderModuleFactory } from '@angular/platform-server';
import { enableProdMode } from '@angular/core';

import * as express from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';

// Required for Firebase
(global as any).WebSocket = require('ws');
(global as any).XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;


// Faster renders in prod mode
enableProdMode();

// Express server
const app = express();

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist');
const APP_NAME = 'YOUR_PROJECT_NAME';

const { AppServerModuleNgFactory } = require(`./dist/${APP_NAME}-server/main`);

// index.html template
const template = readFileSync(join(DIST_FOLDER, APP_NAME, 'index.html')).toString();

app.engine('html', (_, options, callback) => {
  renderModuleFactory(AppServerModuleNgFactory, {
    document: template,
    url: options.req.url,
  }).then(html => {
    callback(null, html);
  });
});

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, APP_NAME));

// Serve static files 
app.get('*.*', express.static(join(DIST_FOLDER, APP_NAME)));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
    res.render(join(DIST_FOLDER, APP_NAME, 'index.html'), { req });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node server listening on http://localhost:${PORT}`);
});
```

## 3. Add a Webpack Config for the Express Server

Create a new file named `webpack.server.config.js` to bundle the express app from previous step. 


```js
const path = require('path');
const webpack = require('webpack');

const APP_NAME = 'YOUR_PROJECT_NAME';

module.exports = {
  entry: {  server: './server.ts' },
  resolve: { extensions: ['.js', '.ts'] },
  mode: 'development',
  target: 'node',
  externals: [/(node_modules|main\..*\.js)/],
  output: {
    path: path.join(__dirname, `dist/${APP_NAME}`),
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

## 4.0 Build Scripts

Update your `package.json` with the following build scripts. 

```js
"scripts": {
  // ... omitted
  "build:ssr": "ng build --prod && ng run YOUR_PROJECT_NAME:server && npm run webpack:ssr",
  "serve:ssr": "node dist/YOUR_PROJECT_NAME/server.js",
  "webpack:ssr": "webpack --config webpack.server.config.js"
},
```

Test your app locally by running `npm run build:ssr && npm run serve:ssr`. 

## 5.0 Deployment

With an existing Firebase project, you can easily deploy your ExpressJS server to [App Engine](https://cloud.google.com/appengine/docs/standard/).


1. Install [gcloud CLI tools](https://cloud.google.com/sdk/gcloud/) and authenticate. 
2. Change the start script in package.json to `"start": "npm run serve:ssr"`
2. Run `gcloud app deploy` and you're on the cloud. 

## Additional Resources

- [Universal Starter Template](https://github.com/angular/universal-starter)
- [AngularFirebase SSR Videos](https://angularfirebase.com/tag/ssr/)