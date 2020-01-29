# Deploy your application on Firebase Hosting & Functions

In this guide, we'll look at how to use `@angular/fire` to automatically deploy an Angular application to Firebase hosting or functions by using the Angular CLI.

`@angular/fire` uses Firebase functions to deploy your Angular universal projects, with server-side rendering enabled.

**Angular Universal deployments work with `@nguniversal/*` version 9.0.0 and above**.

## Step 1: add `@angular/fire` to your project

First, you need to add the `@angular/fire` package to your project. In your Angular CLI project run:

```shell
ng add @angular/fire
```

*Note that the command above assumes you have global Angular CLI installed. To install Angular CLI globally run `npm i -g @angular/cli`.*

First, the command above will check if you have an Angular universal project. It'll do so by looking at your `angular.json` project, looking for a `server` target for the specified project. If it finds one, it'll ask you if you want to deploy the project in a firebase function.

After that it will trigger the `@angular/fire` `ng-add` schematics. The schematics will open a web browser and guide you through the Firebase authentication flow (if you're not signed in already). After you authenticate, you'll see a prompt to select a Firebase hosting project.

The schematics will do the following:

- Add `@angular/fire` to your list of dependencies
- Create `firebase.json`, `.firebaserc` files in the root of your workspace. You can use them to configure your firebase hosting deployment. Find more about them [here](https://firebase.google.com/docs/hosting/full-config)
- Update your workspace file (`angular.json`) by inserting the `deploy` builder

In the end, your `angular.json` project will look like below:

```js
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "sample-app": {
        // ...
        "deploy": {
          "builder": "@angular/fire:deploy",
          "options": {} // Here you may find an "ssr": true option if you've
                        // selected that you want to deploy your Angular universal project
                        // as a firebase function.
        }
      }
    }
    // ...
  },
  "defaultProject": "sample-app"
}
```

If you want to add deployment capabilities to a different project in your workspace, you can run:

```
ng add @angular/fire --project=[PROJECT_NAME]
```

## Step 2: deploying the project

As the second step, to deploy your project run:

```
ng deploy --project=[PROJECT_NAME]
```

*The `--project` option is optional. Learn more [here](https://angular.io/cli/deploy).*

The command above will trigger:

1. Production build of your application
2. Deployment of the produced assets to the firebase hosting project you selected during `ng add`

If you've specified that you want a server-side rendering enabled deployment in a firebase function, the command will also:

1. Create a firebase function in `dist`, which directly consumes `main.js` from your server output directory.
2. Create `package.json` for the firebase function with the required dependencies.
3. Deploy the static assets to firebase hosting and your universal server as a Firebase function.

## Step 3: customization

To customize the deployment flow, you can use the configuration files you're already familiar with from `firebase-tools`. You can find more in the [firebase documentation](https://firebase.google.com/docs/hosting/full-config).
