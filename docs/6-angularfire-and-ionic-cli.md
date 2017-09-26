# 6. Installation and Setup with Ionic

### 0. Prerequisites

Before you start installing AngularFire2, make sure you have latest version of Ionic cli installed.
To verify run the command `ionic -v` and check your version. The CLI should be at least version 3.0.0 or greater.

If not, you may need to do the following:

```bash
# if you have the wrong cli version only
npm uninstall -g ionic
npm cache clean

# reinstall clean version
npm install -g ionic
```

### 1. Create a new project

```bash
ionic start <project-name>
cd <project-name>
```

The Ionic CLI's `start` command will prompt you to pick a starting template, and scaffold out the project for you.

### 2. Test your Setup

```bash
ionic serve
```

Your default browser should start up and display a working Ionic app.

### 3. Install AngularFire 2 and Firebase

```bash
npm install angularfire2 firebase --save
```

Now that you have a new project setup, install AngularFire2 and Firebase from npm.

### 4. Add Firebase config to environments variable

Let's create a new file, `src/environment.ts` and start adding our Firebase config:

```ts
export const firebaseConfig = {
  apiKey: '<your-key>',
  authDomain: '<your-project-authdomain>',
  databaseURL: '<your-database-URL>',
  projectId: '<your-project-id>',
  storageBucket: '<your-storage-bucket>',
  messagingSenderId: '<your-messaging-sender-id>'
};

```


### 5. Setup @NgModule for the AngularFireModule

Open `/src/app/app.module.ts`, inject the Firebase providers, and specify your Firebase configuration.
This can be found in your project at [the Firebase Console](https://console.firebase.google.com):

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

import { AngularFireModule } from 'angularfire2';
import { firebaseConfig } from '../environment';

@NgModule({
  declarations: [ MyApp ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  bootstrap: [IonicApp],
})
export class AppModule {}

```

There will be more or less imports depending on your app. This is just an example setup.


#### Custom FirebaseApp Names
You can optionally provide a custom FirebaseApp name with `initializeApp`.

```ts
@NgModule({
  declarations: [ MyApp ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig, 'my-app-name')
  ],
  bootstrap: [IonicApp],
})
export class AppModule {}
```

### 6. Setup individual @NgModules

After adding the AngularFireModule you also need to add modules for the individual @NgModules that your application needs.
 - AngularFireAuthModule
 - AngularFireDatabaseModule
 - AngularFireStorageModule (Future release)
 - AngularFireMessagingModule (Future release)

#### Adding the Firebase Database and Auth Modules

For example if you application was using both Firebase authentication and the Firebase database you would add:

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';

import { AngularFireModule } from 'angularfire2';
import { firebaseConfig } from '../environment';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';


@NgModule({
  declarations: [ MyApp ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig), // imports firebase/app needed for everything
    AngularFireDatabaseModule, // imports firebase/database, only needed for database features
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features
  ],
  bootstrap: [IonicApp],
})

```

### 7. Inject AngularFireDatabase

Open `/src/pages/home/home.ts`, and start to import `AngularFireDatabase` and `FirebaseListObservable`:

```ts
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  items: FirebaseListObservable<any[]>;
  constructor(
    public db: AngularFireDatabase,
    public navCtrl: NavController,
  ) {}

}
```

### 8. Bind to a list

In `/src/pages/home/home.ts`:

```ts
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  items: FirebaseListObservable<any[]>;
  constructor(
    public db: AngularFireDatabase,
    public navCtrl: NavController,
  ) {
    // In this case, '/list' is a placeholder.
    this.items = db.list('/list')

  }

}
```

Open `/src/pages/home/home.html`:

```html
<ion-header>
  ---
</ion-header>

<ion-content padding>
  <ion-item *ngFor="let item of items | async">
    {{item.$value}}
  </ion-item>
</ion-content>
```

### 9. Run your app

```bash
ionic serve
```

And that's it! If there's any issues, be sure to file an issue on the Angularfire repo or the Ionic repo, depending on who's to blame :smile:

