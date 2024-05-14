# Getting started with AngularFire and Universal

Server-side rendering (SSR) is the process of converting a JavaScript app to plain HTML at request-time, allowing search engine crawlers and linkbots to understand page content reliably. 

## 0. Prerequisites

- @angular/cli >= v6.0
- @angular/fire >= v5.0.0

## 1. Add Angular Universal to your project

Follow the steps from the [Angular Universal Tutorial](https://angular.io/guide/universal) to add Universal to your
project.

```
ng add @nguniversal/express-engine
```

This will create all the files you need and setup all the configurations for Universal rendering for your application.

## 2. Next Steps

Test your app locally by running `npm run dev:ssr`.

_Note: `dev:ssr` is a command that was added to your `package.json` by the `ng add` command that will run the dev server
for your Angular with Universal._ 

### [Next Step: Deploying your Universal application on Cloud Functions for Firebase](cloud-functions.md)
