---
title: Cloud Functions
eleventyNavigation:
  key: Cloud Functions
  parent: Universal
---

## Deploying on Universal sites on Cloud Functions

After [setting up your application with Angular Universal as outlined in Getting Started](getting-started.md), you're now ready to build your application for Firebase Hosting & Cloud Functions.

Cloud Functions for Firebase lets you automatically run backend code in response to events triggered by Firebase features and HTTPS requests. Your code is stored in Google's cloud and runs in a managed environment. There's no need to manage and scale your own servers. [Learn more about Cloud Functions for Firebase](https://firebase.google.com/docs/functions/).

If you don't already have the Firebase CLI installed, do so:

```bash
npm i -g firebase-tools
firebase login
```

Then inside your project root, setup your Firebase CLI project:

```bash
firebase init
```

Configure whichever features you'd want to manage but make sure to select at least `functions` and `hosting`. Choose Typescript for Cloud Functions and use the default `public` directory for Hosting.

After you're configured, you should now see a `firebase.json` file in your project root. Let's add the following `rewrites` directive to it:

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

This will inform Firebase Hosting that it should proxy all requests to Cloud Functions, if a file isn't already present in the hosting directory. Let's go ahead and modify your `package.json` to build for Cloud Functions:

```js
"scripts": {
  // ... omitted
  "build": "ng build && npm run copy:hosting && npm run build:ssr && npm run build:functions",
  "copy:hosting": "cp -r ./dist/YOUR_PROJECT_NAME/* ./public && rm ./public/index.html",
  "build:functions": "npm run --prefix functions build"
},
```

Change the build script in your `functions/package.json` to the following:

```js
"scripts": {
    // ... omitted
    "build": "rm -r ./dist && cp -r ../dist . && tsc",
}
```

Finally, add the following to your `functions/src/index.ts`:

```ts
export const universal = functions.https.onRequest((request, response) => {
  require(`${process.cwd()}/dist/YOUR_PROJECT_NAME-webpack/server`).app(request, response);
});
```

We you should now be able to run `npm run build` to build your project for Firebase Hosting and Cloud Functions.

To test, spin up the emulator with `firebase serve`. Once you've confirmed it's working go ahead and `firebase deploy`.

## Additional Resources

- [Universal Starter Template](https://github.com/angular/universal-starter)
- [FireShip: Angular Universal SSR with Firebase](https://fireship.io/lessons/angular-universal-firebase/)

