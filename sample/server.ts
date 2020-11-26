import 'zone.js/dist/zone-node';

import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { AppServerModule,  } from './src/main.server';
import { APP_BASE_HREF } from '@angular/common';
import { existsSync } from 'fs';

const serviceAccount = require('./service-account.json');

// Polyfill XMLHttpRequest and WS for Firebase
/* tslint:disable:no-string-literal */
global['XMLHttpRequest'] = require('xhr2');
global['WebSocket'] = require('ws');
global['fetch'] = require('node-fetch');
/* tslint:enable:no-string-literal */

// include the protos required to bundle firestore
import 'dir-loader!./firestore-protos';

// The Express app is exported so that it can be used by serverless Functions.
export function app() {
  const server = express();

  // TODO drop the any, express types are a mess right now...
  server.use(cookieParser('some-secret-yada-yada') as any);

  const distFolder = join(process.cwd(), 'dist/sample/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // TODO rename to __updateSession or something, add to the SSR script
  server.post('/createSession', async (req, res) => {
    const admin = require('firebase-admin');
    if (admin.apps.length ===    0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: 'https://aftest-94085.firebaseio.com'
        });
    }
    const idToken = req.header('Authorization')?.split('Bearer ')[1];
    if (idToken) {
        const { uid, exp } = await admin.auth().verifyIdToken(idToken);
        try {
            const { secure, hostname: domain } = req;
            // custom tokens last for an hour, but let's tie expiration to the ID token
            // which triggered the request (which will be < 1 hour)
            const expires = new Date(exp * 1_000);
            // while we may lose some of the details on the server-side let's
            // go with custom tokens since 1) anonymous credentials can't be
            // rehydrated as there is no AnonymousProvider.credential in the
            // JS SDK 2) unless requests with refresh most oauth tokens will
            // time out very quickly (e.g, GoogleAuthProvider)
            const customToken = await admin.auth().createCustomToken(uid);
            const cookie = { uid, customToken };
            res.cookie('__session', JSON.stringify(cookie), { expires, secure, domain, httpOnly: true, signed: true });
            res.send(JSON.stringify({ result: { success: true }}));
        } catch (e) {
            console.warn(e);
            res.clearCookie('__session');
            res.send(JSON.stringify({ result: { success: false }}));
        }
    } else {
        res.clearCookie('__session');
        res.send(JSON.stringify({ result: { success: true }}));
    }
  });

  // Example Express Rest API endpoints
  // app.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }) as any);

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    res.render(indexHtml, { req, providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }] });
  });

  return server;
}

function run() {
  const port = process.env.PORT || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
