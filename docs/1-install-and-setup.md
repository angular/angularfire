# These instructions are for the @next RC5 setup
We have yet to release the RC5 version to the main package because we are still testing it out. We recommend you try it by following the steps below. However, if you are still on RC4, you can refer to the older docs here: https://github.com/angular/angularfire2/blob/5720ebc48fddb2d1e75cd905fb534c4ed2e5c286/docs/1-install-and-setup.md

# 1. Installation and Setup

> Getting started with AngularFire2 is easy with the [Angular CLI](https://github.com/angular/angular-cli). Follow the 10 steps below to get started. Don't worry, we're always working to make this shorter.

**The setups below use the Webpack branch of the [Angular CLI](https://github.com/angular/angular-cli).**

**For the Broccoli/System.js branch [see this set up guide](broccoli-system-js-cli-setup.md)**

### 0. Prerequisites

```bash
npm install -g angular-cli@webpack 
# or install locally
npm install angular-cli@webpack --save-dev
# make sure you have typings installed
npm install -g typings 
```

### 1. Create a new project

```bash
ng new <project-name>
cd <project-name>
```

The Angular CLI's `new` command will set up the latest Angular build in a new project structure.

### 2. Install AngularFire 2 and Firebase

```bash
npm install angularfire2 firebase --save
```

Now that you have a new project setup, install AngularFire 2 and Firebase from npm.

### 3. Setup @NgModule

Open `/src/main.ts`, inject the Firebase providers, and specify your Firebase configuration. 
This can be found in your project at [the Firebase Console](https://console.firebase.google.com):

```ts
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode, NgModule } from '@angular/core';
import { AppComponent, environment } from './app/';
import { AngularFireModule } from 'angularfire2';

// Must export the config
export const firebaseConfig = {
  apiKey: "<your-key>",
  authDomain: "<your-project-authdomain>",
  databaseURL: "<your-database-URL>",
  storageBucket: "<your-storage-bucket>"
};

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class MyAppModule {}

```

### 4. Inject AngularFire

Open `/src/app/<my-app>.component.ts`, and make sure to modify/delete any tests to get the sample working (tests are still important, you know):

```ts
import { Component } from '@angular/core';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: '<my-app>-app',
  templateUrl: '<my-app>.component.html',
  styleUrls: ['<my-app>.component.css']
})
export class <MyApp>Component {
  constructor(af: AngularFire) {
    
  }
}

```

### 5. Bind to a list

In `/src/app/<my-app>.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

@Component({
  moduleId: module.id,
  selector: '<my-app>-app',
  templateUrl: '<my-app>.component.html',
  styleUrls: ['<my-app>.component.css']
})
export class <MyApp>Component {
  items: FirebaseListObservable<any[]>;
  constructor(af: AngularFire) {
    this.items = af.database.list('items');
  }
}
```

Open `/src/app/<my-app>.component.html`:

```html
<ul>
  <li class="text" *ngFor="let item of items | async">
    {{item.$value}}
  </li>
</ul>
```

The `async` pipe unwraps the each item in the people
observable as they arrive. Also the array that is received through the `items` observable contains objects that have a `$value` property. A structure like this:
```
[
  {
    $value: 'something',
    (...)
  },
  {
    $value: 'something else',
    (...)
  },
]
```

### 6. Serve

```bash
ng serve
```

Run the serve command and go to `localhost:4200` in your browser.

And that's it! If it totally borke, file an issue and let us know.

###[Next Step: Retrieving data as objects](2-retrieving-data-as-objects.md)
