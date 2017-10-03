# 7. Deploy AngularFire to Firebase

### 0. Build your Angular project for prod

Before you can deploy your angular project, you need to build a version with your prod environment variables. 
Make sure to add your production firebase configuraiton to the src/environments/environment.prod.ts before you build. 

```bash
# build the angular project, creates a dist folder in your directory
ng build -prod
```

### 1. Run Firebase init

You must initialize Firebase Hosting in order to deploy your application. In order to do this run the `firebase init` command.
This command prompts you to give the public directory. Choose the /dist directory created by the `ng build -prod`. 
`firebase init` will also ask you if you want to overwrite your index file. Type `no` since your angular app includes a index file.

### 2. Deploy your Project

To deploy your app, simply run `firebase deploy`!

For more information on Firebase `init` and `deploy` commands, checkout the [Firebase CLI documentation](https://firebase.google.com/docs/cli/).
