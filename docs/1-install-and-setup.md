# 1. Installation and Setup

> Getting started with AngularFire2 is easy with the [Angular CLI](https://github.com/angular/angular-cli). Follow the 10 steps below to get started. Don't worry, we're always working to make this shorter.

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

### 4. Setup @NgModule

Open `/src/app/app.module.ts`, inject the Firebase providers, and specify your Firebase configuration.
This can be found in your project at [the Firebase Console](https://console.firebase.google.com):

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';

// Must export the config
export const firebaseConfig = {
  apiKey: '<your-key>',
  authDomain: '<your-project-authdomain>',
  databaseURL: '<your-database-URL>',
  storageBucket: '<your-storage-bucket>',
  messagingSenderId: '<your-messaging-sender-id>'
};

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(firebaseConfig)
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
    AngularFireModule.initializeApp(firebaseConfig, 'my-app-name')
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```


### 5. Inject AngularFireDatabase

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

### 6. Bind to a list

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

### 7. Run your app

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
