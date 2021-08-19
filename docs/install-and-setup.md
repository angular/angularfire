# AngularFire Quickstart

### 1. Create a new project

```bash
npm install -g @angular/cli
ng new <project-name>
cd <project-name>
```

The Angular CLI's `new` command will set up the latest Angular build in a new project structure.

### 2. Install AngularFire and Firebase

```bash
ng add @angular/fire@next
```

Now that you have a new project setup, install AngularFire and Firebase from npm.

### 3. Add Firebase config to environments variable

Open `/src/environments/environment.ts` and add your Firebase configuration. You can find your project configuration in [the Firebase Console](https://console.firebase.google.com). Click the Gear icon next to Project Overview, in the Your Apps section, create a new app and choose the type Web. Give the app a name and copy the config values provided.

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

### 4. Setup `@NgModule` for the `AngularFireModule`

Open `/src/app/app.module.ts`, inject the Firebase providers, and specify your Firebase configuration.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
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

### 5. Setup individual `@NgModule`s

After adding the AngularFireModule you also need to add modules for the individual @NgModules that your application needs.

For example if your application was using both Google Analytics and the Firestore you would add `AngularFireAnalyticsModule` and `AngularFirestoreModule`:

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule,
    AngularFirestoreModule
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

### 7. Inject `AngularFirestore`

Open `/src/app/app.component.ts`, and make sure to modify/delete any tests to get the sample working (tests are still important, you know):

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  constructor(firestore: AngularFirestore) {

  }
}
```

### 8. Bind a Firestore collection to a list

In `/src/app/app.component.ts`:

```ts
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent {
  items: Observable<any[]>;
  constructor(firestore: AngularFirestore) {
    this.items = firestore.collection('items').valueChanges();
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

### 9. Run your app locally

```bash
ng serve
```

Your Angular app will compile and serve locally, visit it we should see an empty list.

In another tab [start adding data to an `items` collection in Firestore](https://firebase.google.com/docs/firestore/manage-data/add-data). *As we're not authenticating users yet, be sure to start Firestore in **test mode** or allow reading from the `items` collection in Security Rules (`allow read: if true`).*

Once you've created a `items` collection and are inserting documents, you should see data streaming into your Angular application.

### 10. Deploy your app

Finally, we can deploy the application to Firebase hosting:

```bash
ng deploy
```
