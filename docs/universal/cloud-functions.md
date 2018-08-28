# Deploying your Universal application on Cloud Functions for Firebase

Pre-req, previous page, something, something, firebase cli

```bash
npm i -g @firebase-tools
```

```bash
firebase login
```

Init Firebase if you haven't:

```bash
firebase init
```

Whatever features you want but at least `functions` and `hosting`. For Functions, choose `typescript` and Hosting the default `public` directory is fine.

Let's make some modifications to our `package.json`, to build for Functions.

```js
"scripts": {
  // ... omitted
  "build:ssr": "ng build --prod && npm run build:hosting && npm run build:functions",
  "build:hosting": "npm run copy:hosting",
  "copy:hosting": "cp -r ./dist/afdocsite/* ./public && rm ./public/index.html",
  "copy:functions": "rm -r ./dist && cp -r ../dist .",
  "webpack:ssr": "webpack --config webpack.server.config.js",
  "build:functions": "ng run YOUR_PROJECT_NAME:server && npm run webpack:ssr && npm run copy:functions && npm run --prefix functions build"
},
```

Add the following to your `functions/src/index.ts`:

```ts
export const universal = functions.https.onRequest((request, response) => {
  require(`${process.cwd()}/dist/YOUR_PROJECT_NAME-webpack/server`).app(request, response);
});
```

Add the following to your `firebase.json`:

```js
{
  // ...
  "hosting": {
    // ...
    "rewrites": [
      { "source": "**", "function": "universal" }
    ]
  }
}
```

We can now `firebase serve` and `firebase deploy`.

Something, something, cache-control...

### [Optional Next Step: Prerendering your Universal application for Firebase Hosting](prerendering.md)

## Additional Resources

- [Universal Starter Template](https://github.com/angular/universal-starter)
- [AngularFirebase SSR Videos](https://angularfirebase.com/tag/ssr/)