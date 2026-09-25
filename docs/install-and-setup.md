# AngularFire Quickstart

## Before you begin

- **Firebase CLI**
  - Setup uses the Firebase CLI (`firebase-tools`). Install it with `npm install -g firebase-tools`, then run `firebase login`. If `ng add` can't find a copy, it installs the newest version for you.
  - Run `ng add` yourself, not through an AI agent.
    - In AngularFire 21.0.0-rc.1 and earlier, `ng add` run by an agent with firebase-tools 15.26 or later stops after you choose features, with `Cannot read properties of undefined (reading 'email')`.
    - If it already stopped, run `ng add @angular/fire@next` again yourself. The stopped run leaves nothing to clean up.
  - A copy older than 14 stops setup with `firebase-tools version 14.0.0+ is required, please upgrade and run again`, and `ng add` does not upgrade a copy you already have.
- **Harmless CLI noise.** The Firebase CLI may print a `punycode` deprecation warning or ask about enabling extra features (for example Gemini) during setup. These come from the CLI, not from AngularFire, and are safe to ignore.

### 1. Create a new project

```bash
# Using yarn create
yarn create @angular@21 <project-name>
cd <project-name>
```
or 

```bash
# Using npm create
npm create @angular@21 <project-name>
cd <project-name>
```

optionally installing the tooling directly:
```bash
# Installing the tooling directly
npm install -g @angular/cli@21
ng new <project-name>
cd <project-name>
```

These commands set up an Angular 21 project, the version AngularFire 21 supports.

### 2. Install AngularFire and Firebase

AngularFire 21 is currently a release candidate, published under the `next` tag:

```bash
ng add @angular/fire@next
```

This installs AngularFire and configures your project. `ng add` will:

1. Prompt you to select the features to enable and the Firebase project to use, signing you in to Firebase if needed.
2. Add `provideFirebaseApp(...)`, along with a provider for each feature you select, to your app configuration (for example `app.config.ts`), with your Firebase configuration inlined. No environment files are created.

`ng add` writes the version it installed into your `package.json`, and today that is a canary release such as `21.0.0-rc.1-canary.95b3de1` rather than the release candidate. To replace it with the release candidate, `21.0.0-rc.1`, run:

```bash
npm install --save-exact @angular/fire@next
```

### 3. Inject `Firestore`

Open `/src/app/app.ts` and make the following changes:

```ts
import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [AsyncPipe],
})
export class App {
  firestore: Firestore = inject(Firestore);

  constructor() {

  }
}
```

### 4. Bind a Firestore collection to a list

In `/src/app/app.ts`:

```ts
import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';

interface Item {
  name: string;
}

@Component({
  selector: 'app-root',
  imports: [AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  firestore: Firestore = inject(Firestore);
  items$: Observable<Item[]>;

  constructor() {
    const aCollection = collection(this.firestore, 'items')
    this.items$ = collectionData<Item>(aCollection);
  }
}
```

Open `/src/app/app.html`:

```html
<ul>
  @for (item of items$ | async; track item) {
    <li>{{ item.name }}</li>
  }
</ul>
```

### 5. Run your app locally

```bash
ng serve
```

Your Angular app will compile and serve locally, visit it we should find an empty list.

In another tab [start adding data to an `items` collection in Firestore](https://firebase.google.com/docs/firestore/manage-data/add-data). *As we're not authenticating users yet, be sure to start Firestore in **test mode** or allow reading from the `items` collection in Security Rules (`allow read: if true`).*

Once you've created a `items` collection and are inserting documents, you should find data streaming into your Angular application and being rendered in your browser.

### 6. Deploy your app

How you deploy depends on whether your app uses server-side rendering (SSR), which the Angular CLI asks about when you create the project.

**Client-side rendered apps** (the default) build to static files, which you deploy to Firebase Hosting. Follow Firebase's [Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart) to build and deploy your app.

**Server-side rendered apps** run a Node server, so deploy them to [Firebase App Hosting](app-hosting.md), Firebase's recommended path for SSR. That guide also covers a common case where an SSR app silently falls back to client-side rendering after deploying.
