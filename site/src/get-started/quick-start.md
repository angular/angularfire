---
title: Quick start
eleventyNavigation:
  key: Quick start
  parent: Get started
---

## Create a new project

```bash
npm install -g @angular/cli
ng new <project-name>
cd <project-name>
```

The Angular CLI's `new` command will set up the latest Angular build in a new project structure.

## Install AngularFire and Firebase

```bash
ng add @angular/fire
```

Now that you have a new project setup, install AngularFire and Firebase from npm.

## Add Firebase config to environments variable

Open `/src/environments/environment.ts`, create it if it doesn't exist, and add your Firebase configuration. You can find your project configuration in [the Firebase Console](https://console.firebase.google.com). Click the Gear icon next to Project Overview, in the Your Apps section, create a new app and choose the type Web. Give the app a name and copy the config values provided.

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: '<your-key>',
    authDomain: '<your-project-authdomain>',
    databaseURL: '<your-database-URL>',
    projectId: '<your-project-id>',
    storageBucket: '<your-storage-bucket>',
    messagingSenderId: '<your-messaging-sender-id>',
    appId: '<your-app-id>',
    measurementId: '<your-measurement-id>'
  }
};
```

## Configuring Firebase in your Angular Application

### Set up Firebase for `@NgModule` based apps
For applications bootstrapped using `@NgModule`, add the Firebase providers to the imports array of the `@NgModule` decorator metadata.

In `/src/app/app.module.ts` update the code to:.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```
### Set up Firebase for Standalone API based apps
Beginning in [Angular v14](https://blog.angular.io/angular-v14-is-now-available-391a6db736af) applications can be built and bootstrapped using the set of [Standalone APIs](https://angular.io/guide/standalone-components).

The provider configuration for these applications should be added to the `bootstrapApplication` function in `main.ts`:

```ts
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';


bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(()=> initializeApp(environment.firebase))
  ],
}).catch(err => console.error(err));
```

### Configuring Firebase features

After adding the Firbase app providers, you also need to add providers for the each of  Firebase features your application needs.

For example if your application uses both Google Analytics and the Firestore database you would add `provideAnalytics` and `provideFirestore`:

```ts
// Module based configuration app.module.ts

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(()=> getAnalytics()),
    provideFirestore(() => getFirestore()),
    AngularFireAnalyticsModule,
    AngularFirestoreModule
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

```ts
// Standalone API based config (main.ts)
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore'
import { getAuth, provideAuth } from '@angular/fire/auth';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';


bootstrapApplication(AppComponent, {
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ],
}).catch(err => console.error(err));
```
## Inject `AngularFirestore`

Open `/src/app/app.component.ts`, and make sure to modify/delete any tests to get the sample working (tests are still important, you know):

```ts
import { Component, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  private firestore: AngularFirestore = inject(Firestore)
  ...
}
```

## Bind a Firestore collection to a list

In `/src/app/app.component.ts`:

```ts
import { Component } from '@angular/core';
import { Firestore, collection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  private firestore: Firestore = inject(Firestore);
  items$: Observable<any[]>;

  constructor() {
    const itemsCollectionRef = collection(this.firestore, 'items');
    this.items = collectionData(itemsCollectionRef) as Observable<any[]>;
  }
}
```

Open `/src/app/app.component.html`:

```html
<ul>
  <li class="text" *ngFor="let item of items$ | async">
    {{item.name}}
  </li>
</ul>
```

## Run your app locally

```bash
ng serve
```

Your Angular app will compile and serve locally, visit it we should see an empty list.

In another tab [start adding data to an `items` collection in Firestore](https://firebase.google.com/docs/firestore/manage-data/add-data). *As we're not authenticating users yet, be sure to start Firestore in **test mode** or allow reading from the `items` collection in Security Rules (`allow read: if true`).*

Once you've created a `items` collection and are inserting documents, you should see data streaming into your Angular application.

## Deploy your app

Finally, we can deploy the application to Firebase hosting:

```bash
ng deploy
```