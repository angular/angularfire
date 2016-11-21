# Ionic2 - Auth using AngularFire2

This document provides you a walkthrough of integrating AngularFire2 Authentication with Ionic2.
The below setup has been tested on Windows 10, but it should be same for Mac/Linux.

Ensure that you're executing these commands as **Administrator** on Windows and **sudo** on Mac/Linux to avoid any errors.

### Prerequisites
The first step is to ensure you've latest version of **Node** installed.
You can get the latest version from [here](https://nodejs.org). 
This will install both node and npm.

After installing node, check the version by executing the following command in your prompt window.

```bash

C:\projects>node -v
v6.9.1 

```

As of writting this document, this is the most stable version. If you're not on this version, 
please upgrade yourself to latest version by installing node from [here](https://nodejs.org).

Check your npm version by executing the following command.

```bash

C:\projects>npm -v
3.10.8

```

**_Your Application code sits on top of Ionic Framework and the Ionic Framework sits on top of Cordova._**

Let's get them installed globally, so that all projects can use them.

Execute the following commands.

```bash

C:\projects>npm install -g cordova

C:\projects>npm install -g ionic

```

Once the above commands are executed successfully, Check the versions of corodva and ionic by executing the following commands.

```bash

C:\projects>cordova -v
6.4.0

C:\projects>ionic -v
2.1.8

```

These are the latest versions as of writting this document.

On successful execution of above commands, you're all set to create your Ionic 2 app.
To create your app, change into the directory where you want your app to reside and execute the following command

```bash

C:\projects> ionic start Ionic_AngularFire2_Project blank --v2

```

>The command ionic start will create the project with name "Ionic_AngularFire2_Project" using "blank" template.

>The --v2 flag ensures, this is a Ionic2 project.

Change to the project directory, which was just created with above command

>C:\projects\Ionic_AngularFire2_Project>

To start your app, execute the following command

```bash

C:\projects\Ionic_AngularFire2_Project> ionic serve

```

If everything is installed correctly, the app should open your browser with the dev server running at following url 
**`http://localhost:8100`** and will display default home page.

Stop you server by pressing "ctrl + c", if it is still running from the above step and 
install typings and typescript globally by executing the following commands:

**Note:-** typings is not required for our current application to work, but it will be helpful incase you want to bring in
external libraries and extend this application.

```bash

C:\projects\Ionic_AngularFire2_Project>npm install -g typings 

C:\projects\Ionic_AngularFire2_Project>npm install -g typescript

```

Check typings and typescript versions by executing following commands:

```bash

C:\projects\Ionic_AngularFire2_Project>typings -v
2.0.0

C:\projects\Ionic_AngularFire2_Project>tsc -v
Version 2.0.10

```

### Configuring AngularFire2 and Firebase

Install angularfire2 and firebase by executing the following command in your project directory

```ts

C:\projects\Ionic_AngularFire2_Project>npm install angularfire2 firebase --save

```

_This should add angularfire2 and firebase entry in your project's package.json file in dependencies section. Something similar_

>"angularfire2": "^2.0.0-beta.6",

>"firebase": "^3.6.1",

### Setup @NgModule

Open your project in your favourite editor and open the `app.module.ts` file, under `src/app`
and add the following three entries.

>1) Import AngularFireModule at top.

>2) Define your firebaseConfig constant.

>3) Initialize your app, by calling it in the "imports" array in @NgModule

your `app.module.ts` file should look something like this.

```bash

import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { AngularFireModule } from 'angularfire2';

export const firebaseConfig = {
  apiKey: "xxxxxxxxxx",
  authDomain: "your-domain-name.firebaseapp.com",
  databaseURL: "https://your-domain-name.firebaseio.com",
  storageBucket: "your-domain-name.appspot.com",
};

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: []
})
export class AppModule { }

```
### Inject AngularFire and Bind it to List

Now inject AngularFire in your component. Open your `home.ts` by going into `src/pages/home/home.ts` and make the following changes:

>1) Import "AngularFire, FirebaseListObservable" at the top of your component.

>2) Inject your AngularFire dependency in the constructor.

>3) Call the list method on angularFire's database object.

Your `home.ts` file should look like this.

```bash

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AngularFire, FirebaseListObservable } from 'angularfire2';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  items: FirebaseListObservable<any[]>;

  constructor(public navCtrl: NavController,af: AngularFire) {
    this.items = af.database.list('/items');
  }

}

```

**Update** your `home.html` at `src/pages/home/home.html`, with following entry

```bash

<ion-header>
  <ion-navbar>
    <ion-title>
      Ionic Blank
    </ion-title>
  </ion-navbar>
</ion-header>

<ion-content padding>
  <ion-list>
  <ion-item class="text" *ngFor="let item of items | async">
    {{item.$value}}
  </ion-item>
  </ion-list>
</ion-content>

```

** Run your app by executing the following command **

```bash

C:\projects\Ionic_AngularFire2_Project> ionic serve

```

####_This should fetch the data from firebase._

## Configuring AngularFire2 Auth with Ionic2

Continuing with the above example stop your server by pressing `ctrl+c` and go to command prompt and 
generate a service by executing the following command

```bash

C:\projects\Ionic_AngularFire2_Project> ionic g provider AuthService

```

This should create the AuthService under `src/providers/auth-service.ts`.
Update the service with the following code.

```bash

import { Injectable } from '@angular/core';
import { AuthProviders, FirebaseAuth, FirebaseAuthState, AuthMethods } from 'angularfire2';

@Injectable()
export class AuthService {
  private authState: FirebaseAuthState;

  constructor(public auth$: FirebaseAuth) {
    this.authState = auth$.getAuth();
    auth$.subscribe((state: FirebaseAuthState) => {
      this.authState = state;
    });
  }

  get authenticated(): boolean {
    return this.authState !== null;
  }

  signInWithFacebook(): firebase.Promise<FirebaseAuthState> {
    return this.auth$.login({
      provider: AuthProviders.Facebook,
      method: AuthMethods.Popup
    });
  }

  signOut(): void {
    this.auth$.logout();
  }

  displayName(): string {
    if (this.authState != null) {
      return this.authState.facebook.displayName;
    } else {
      return '';
    }
  }  
}

```

Add your service in `app.module.ts`. Your `app.module.ts` should look like this

```bash

import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { AngularFireModule } from 'angularfire2';
import { AuthService } from '../providers/auth-service';


export const firebaseConfig = {
  apiKey: "xxxxxxxxxx",
  authDomain: "your-domain-name.firebaseapp.com",
  databaseURL: "https://your-domain-name.firebaseio.com",
  storageBucket: "your-domain-name.appspot.com",
};

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [AuthService]
})
export class AppModule { }

```

Update your `home.html` to add a login button. Your `home.html` should look like this

```bash

<ion-header>
  <ion-navbar>
    <ion-title>
      Ionic Blank
    </ion-title>
  </ion-navbar>
</ion-header>

<ion-content padding>
  <ion-list>
  <ion-item class="text" *ngFor="let item of items | async">
    {{item | json}}
  </ion-item>
  </ion-list>

  <button ion-button outline (click)="signInWithFacebook()">Facebook</button>
</ion-content>

```

and finally, add the corresponding click handlers in `home.ts` as follows. 
Also, ensure the *AuthService* is injected in the constructor. Your `home.ts` should look like this

```bash

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AuthService } from '../../providers/auth-service';
import { AngularFire, FirebaseListObservable } from 'angularfire2';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  items: FirebaseListObservable<any[]>;

  constructor(public navCtrl: NavController,af: AngularFire,private _auth: AuthService) {
    this.items = af.database.list('/items');
  }

  signInWithFacebook(): void {
    this._auth.signInWithFacebook()
      .then(() => this.onSignInSuccess());
  }

  private onSignInSuccess(): void {    
    console.log("Facebook display name ",this._auth.displayName());
  }

}

```

Now run your app and if everything is configured correctly, you should be able to click on the login button in your app, 
which should open the facebook pop-up.

Once you authenticate yourself, you should see your Facebook display name in console.

You can try redirecting yourself to another page to grab additional details from Facebook. 
