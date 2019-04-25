# 1. Installation and Setup

> Using Ionic and the Ionic CLI? Check out these [specific instructions](ionic/cli.md) for Ionic and their CLI.

> The following instructions use the `ng add` command that automates several steps for you. If you want to set up things manually, refer to [these steps](install-and-setup-manual.md) instead.

### 0. Prerequisites

AngularFire provides multiple module formats for different types of builds. The guide is based on the Angular CLI. It is possible to do a manual setup with Webpack or a SystemJS build as well.

```bash
npm install @angular/cli
```

### 1. Create a new project

```bash
ng new <project-name>
cd <project-name>
```

The Angular CLI's `new` command will set up the latest Angular build in a new project structure.

### 2. Test your setup

```bash
ng serve
open http://localhost:4200
```

You should see a message on the page that says *App works!*

### 3. Add AngularFire

```bash
ng add @angular/fire
```

This command will install `@angular/fire` and `firebase` from npm, prepare configuration variables and import AngularFire module(s) into your App's NgModule.

#### Custom `FirebaseApp` names

You can optionally provide a custom FirebaseApp name by providing the `--firebaseApp=my-app-name` flag.

#### Setup individual `@NgModules`

By providing the `--all` flag you can also add modules for the individual @NgModules that your application needs:

 - `AngularFireAuthModule`
 - `AngularFireDatabaseModule`
 - `AngularFireFunctionsModule`
 - `AngularFirestoreModule`
 - `AngularFireStorageModule`
 - `AngularFireMessagingModule`

### 4. Edit Firebase configuration

Open `/src/environments/environment.ts` and edit your Firebase configuration. You can find your project configuration in [the Firebase Console](https://console.firebase.google.com). From the project overview page, click **Add Firebase to your web app**.

```ts
export const environment = {
  firebase: {
    apiKey: '<your-key>',
    authDomain: '<your-project-authdomain>',
    databaseURL: '<your-database-URL>',
    projectId: '<your-project-id>',
    storageBucket: '<your-storage-bucket>',
    messagingSenderId: '<your-messaging-sender-id>',
  },
  production: false
};
```

### 5. Inject `AngularFirestore`

Open `/src/app/app.component.ts`, and make sure to modify/delete any tests to get the sample working (tests are still important, you know):

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  constructor(db: AngularFirestore) {}
}
```

### 6. Bind a Firestore collection to a list

In `/src/app/app.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  items: Observable<any[]>;
  constructor(db: AngularFirestore) {
    this.items = db.collection('items').valueChanges();
  }
}
```

Open `/src/app/app.component.html`:

```html
<ul>
  <li class="text" *ngFor="let item of items | async">
    {{item.name}}
  </li>
</ul>
```

### 7. Run your app

```bash
ng serve
```

Run the serve command and navigate to `localhost:4200` in your browser.

And that's it! If it's totally _borked_, file an issue and let us know.

### [Next Step: Documents in AngularFirestore](firestore/documents.md)
