# Firebase Tools Install and Setup

### 1. Install package

```bash
npm install -g firebase-tools
```

or with `yarn`

```bash
yarn global add firebase-tools
```

You can also choose to install it as a dependency for your project rather than globally

```bash
npm install --save-dev firebase-tools
```

or with `yarn`

```bash
yarn add -D firebase-tools
```

### 2. Configure Firebase Tools

In your projects root directory run:

```bash
firebase init
```

or if your installed it within your project rather than globally

```bash
npx firebase init
```

or with `yarn`

```bash
yarn firebase init
```

This will ask you to login if you are not logged in already, the process will take you through a browser
redirect to log you into Firebase.

### 3. Choose what Firebase features

`firebase-tools` displays Firebase features you want to configure.

```bash
? Which Firebase features do you want to set up for this directory? Press Space 
to select features, then Enter to confirm your choices. (Press <space> to select
, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
 ◯ Realtime Database: Configure a security rules file for Realtime Database and 
(optionally) provision default instance
 ◯ Firestore: Configure security rules and indexes files for Firestore
 ◯ Functions: Configure a Cloud Functions directory and its files
 ◯ Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub 
Action deploys
 ◯ Hosting: Set up GitHub Action deploys
(Move up and down to reveal more choices)
```

### 4. Connect your repo to a Firebase project

The CLI will then walk you through making sure your repo is configured with a Firebase project.

```bash
? Please select an option: 
  ◯ Use an existing project 
  ◯ Create a new project 
  ◯ Add Firebase to an existing Google Cloud Platform project 
  ◯ Don't set up a default project
  ```