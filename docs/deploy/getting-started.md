# Deploy your application on Firebase Hosting

In this guide, we'll look at how to use `@angular/fire` to automatically deploy an Angular application to Firebase hosting by using the Angular CLI.

## Step 1: add `@angular/fire` to your project

First, you need to add the `@angular/fire` package to your project. In your Angular CLI project run:

```shell
ng add @angular/fire
```

*Note that the command above assumes you have global Angular CLI installed. To install Angular CLI globally run `npm i -g @angular/cli`.*

The command above will trigger the `@angular/fire` `ng-add` schematics. Once they install `@angular/fire`. If you are not authenticated, the schematics will open a browser which will guide you through the authentication flow. Once you authenticate, you'll see a prompt to select a Firebase hosting project.

The schematics will do the following:

- Add `@angular/fire` to your list of dependencies
- Create `firebase.json`, `.firebaserc` files in the root of your workspace. You can use them to configure your firebase hosting deployment. Find more about them [here](https://firebase.google.com/docs/hosting/full-config)
- Update your workspace file (`angular.json`) by inserting the `deploy` builder

In the end, your `angular.json` project will look like below:

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "sample-app": {
        // ...
        "deploy": {
          "builder": "@angular/fire:deploy",
          "options": {}
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
ng run [PROJECT_NAME]:deploy
```

The command above will trigger:

1. Production build of your application
2. Deployment of the produced assets to the firebase hosting project you selected during `ng add`

## Step 3: customization

To customize the deployment flow, you can use the configuration files you're already familiar with from `firebase-tools`. You can find more in the [firebase documentation](https://firebase.google.com/docs/hosting/full-config).
