# 1. Installation and Setup

> Getting started with AngularFire2 is easy with the [Angular CLI](https://github.com/angular/angular-cli). Follow the 10 steps below to get started. Don't worry, we're always working to make this shorter.

> Using Ionic and the Ionic CLI? Check out these [specific instructions](6-angularfire-and-ionic-cli.md) for Ionic and their CLI.

### 0. Prerequisites

Before you start installing AngularFire2, make sure you have latest version of angular-cli installed.
To verify run the command `ng -v` and ensure you see `angular-cli: 1.x.x-beta.xx`. The lowest compatible version is `1.x.x-beta.14`.

If not, you may need to do the following:

```bash
# if you have the wrong cli version only
npm uninstall -g angular-cli
npm uninstall -g @angular/cli
npm cache clean

# reinstall clean version
npm install -g @angular/cli@latest
```

You need the Angular CLI, typings, and TypeScript.

```bash
npm install -g @angular/cli@latest
# or install locally
npm install @angular/cli --save-dev
# make sure you have typings installed
npm install -g typings
npm install -g typescript
```

### 1. Create a new project

```bash
ng new <project-name>
cd <project-name>
```

The Angular CLI's `new` command will set up the latest Angular build in a new project structure.

### 2. Test your Setup

```bash
ng serve
open http://localhost:4200
```

You should see a message that says *App works!*

### 3. Install AngularFire 2 and Firebase

```bash
npm install angularfire2 firebase --save
```

Now that you have a new project setup, install AngularFire2 and Firebase from npm.

### 4. Add Firebase config to environments variable

Open `/src/environments/environment.ts` and add your Firebase configuration:

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: '<your-key>',
    authDomain: '<your-project-authdomain>',
    databaseURL: '<your-database-URL>',
    projectId: '<your-project-id>',
    storageBucket: '<your-storage-bucket>',
    messagingSenderId: '<your-messaging-sender-id>'
  }
};
```

### 5. Setup @NgModule for the AngularFireModule

Open `/src/app/app.module.ts`, inject the Firebase providers, and specify your Firebase configuration.
This can be found in your project at [the Firebase Console](https://console.firebase.google.com):

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase)
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}

```

#### Custom FirebaseApp Names
You can optionally provide a custom FirebaseApp name with `initializeApp`.

```ts
@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase, 'my-app-name')
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

### 6. Setup individual @NgModules

After adding the AngularFireModule you also need to add modules for the individual @NgModules that your application needs.
 - AngularFireAuth
 - AngularFireDatabase
 - AngularFireStorage (Future release)
 - AngularFireMessaging (Future release)

#### Adding the Firebase Database and Auth Modules

For example if your application was using both Firebase authentication and the Firebase database you would add:

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase, 'my-app-name'), // imports firebase/app needed for everything
    AngularFireDatabase, // imports firebase/database, only needed for database features
    AngularFireAuth, // imports firebase/auth, only needed for auth features
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}

```

### 7. Inject AngularFireDatabase

Open `/src/app/app.component.ts`, and make sure to modify/delete any tests to get the sample working (tests are still important, you know):

```ts
import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  constructor(db: AngularFireDatabase) {

  }
}

```

### 8. Bind to a list

In `/src/app/app.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  items: FirebaseListObservable<any[]>;
  constructor(db: AngularFireDatabase) {
    this.items = db.list('/items');
  }
}
```

Open `/src/app/app.component.html`:

```html
<ul>
  <li class="text" *ngFor="let item of items | async">
    {{item.$value}}
  </li>
</ul>
```

### 9. Run your app

```bash
ng serve
```

Run the serve command and go to `localhost:4200` in your browser.

And that's it! If it's totally *borked*, file an issue and let us know.

### [Next Step: Retrieving data as objects](2-retrieving-data-as-objects.md)

### Troubleshooting

#### 1. Cannot find namespace 'firebase'.

If you run into this error while trying to invoke `ng serve`, open `src/tsconfig.json` and add the "types" array as follows:

```json
{
  "compilerOptions": {
    ...
    "typeRoots": [
      "../node_modules/@types"
    ],

    // ADD THIS
    "types": [
      "firebase"
    ]
  }
}
```

#### 2. Cannot find name 'require' (This is just a temporary workaround for the Angular CLI).

If you run into this error while trying to invoke `ng serve`, open `src/typings.d.ts` and add the following two entries as follows:

```bash
declare var require: any;
declare var module: any;
```
