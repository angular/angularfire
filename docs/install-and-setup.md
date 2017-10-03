# 1. Installation and Setup

> Using Ionic and the Ionic CLI? Check out these [specific instructions](ionic/cli.md) for Ionic and their CLI.

### 0. Prerequisites

AngularFire provides multiple module formats for different types of builds. The guide is based off the Angular CLI. It is possible to do a manual setup with Webpack or a SystemJS build as well.

```bash
npm install @angular/cli
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

### 3. Install AngularFire and Firebase

```bash
npm install angularfire2 firebase --save
```

Now that you have a new project setup, install AngularFire and Firebase from npm.

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
 - AngularFirestoreModule
 - AngularFireAuthModule
 - AngularFirestoreModule
 - AngularFireDatabaseModule
 - AngularFireStorageModule (Future release)
 - AngularFireMessagingModule (Future release)

#### Adding the Firebase Database and Auth Modules

For example if your application was using both Firebase authentication and the Firebase database you would add:

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase, 'my-app-name'), // imports firebase/app needed for everything
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}

```

### 7. Inject AngularFirestore

Open `/src/app/app.component.ts`, and make sure to modify/delete any tests to get the sample working (tests are still important, you know):

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  constructor(db: AngularFirestore) {

  }
}

```

### 8. Bind to a list

In `/src/app/app.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { Observable } from 'rxjs/Observable';

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

### 9. Run your app

```bash
ng serve
```

Run the serve command and go to `localhost:4200` in your browser.

And that's it! If it's totally *borked*, file an issue and let us know.

### [Next Step: Documents in AngularFirestore](firestore/documents.md)
