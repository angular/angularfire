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
  "build": "ng build && npm run copy:hosting && npm run build:ssr && npm run build:functions",
  "copy:hosting": "cp -r ./dist/YOUR_PROJECT_NAME/* ./public && rm ./public/index.html",
  "build:functions": "npm run --prefix functions build"
},
```

Add the following to your `functions/src/index.ts`:

```ts
export const universal = functions.https.onRequest((request, response) => {
  require(`${process.cwd()}/dist/YOUR_PROJECT_NAME-webpack/server`).app(request, response);
});
```

Change the build script in your `functions/package.json` to the following:

```js
"scripts": {
    // ... omitted
    "build": "rm -r ./dist && cp -r ../dist . && tsc",
}
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

We can now run `npm run build`, `firebase serve` and `firebase deploy`.

Something, something, cache-control...

### [Optional Next Step: Prerendering your Universal application for Firebase Hosting](prerendering.md)

## Additional Resources

- [Universal Starter Template](https://github.com/angular/universal-starter)
- [AngularFirebase SSR Videos](https://angularfirebase.com/tag/ssr/)