# Using AngularFire with Ionic

This tutorial provides a walkthrough of integrating ANgularFIre Authentication with Ionic 3 /Angular 4+. 
The below setup has been tested on Windows 10, but it should be same for Mac/Linux.

Note: - If you're working with Ionic2 and Angular2.0, then you should refer to **Auth-with-Ionic2** tutorial 
[here](https://github.com/angular/angularfire2/blob/master/docs/Auth-with-Ionic2.md)

Ensure that you're executing these commands as **Administrator** on Windows and **sudo** on Mac/Linux to avoid any errors.

This tutorial uses **Facebook** as the sign-in provider. After completion of this tutorial, you should be able to configure
other sign-in providers like **Twitter**, **Google** on your own.

### Prerequisites
The first step is to ensure you've latest version of **Node** installed.
You can get the latest version from [here](https://nodejs.org).
This will install both node and npm.

After installing node, check the version by executing the following command in your prompt window.

```bash

C:\projects>node -v
v6.10.2

```
As of writting this document, this is the most stable version. If you're not on this version,
please upgrade yourself to latest version by installing node from [here](https://nodejs.org).

Check your npm version by executing the following command.
```bash

C:\projects>npm -v
3.10.10

```
Install the Angular CLI, which will be used to build our Angular project and install Angular version 4 later.

```bash
C:\projects>npm install -g @angular/cli
```
Check your angular version by executing the following command.

```bash
C:\projects>ng -v

@angular/cli: 1.0.0
node: 6.10.2
os: win32 x64
```

**_Your Application code sits on top of Ionic Framework and the Ionic Framework sits on top of Cordova._**

Let's get them installed globally, so that all projects can use them.

Execute the following commands.

```bash

C:\projects>npm install -g cordova

C:\projects>npm install -g ionic

```

Once the above commands are executed successfully, Check the versions of cordova and ionic by executing the following commands.

```bash
C:\projects>cordova -v
7.0.1

C:\projects>ionic -v
3.4.0
```

These are the latest versions as of writting this document.

On successful execution of above commands, you're all set to create your app with Ionic framework.

To create your app, change into the directory where you want your app to reside and execute the following command

```bash
C:\projects> ionic start auth-ng4-ionic3-af2 blank
```

>The command ionic start will create the project with name "Ionic_AngularFire2_Project" using "blank" template.

Change to the project directory, which was just created with above command

> C:\projects\auth-ng4-ionic3-af2>ionic info

```bash
global packages:

    @ionic/cli-utils : 1.4.0
    Cordova CLI      : 7.0.1
    Ionic CLI        : 3.4.0

local packages:

    @ionic/app-scripts              : 1.3.12
    @ionic/cli-plugin-cordova       : 1.4.0
    @ionic/cli-plugin-ionic-angular : 1.3.1
    Cordova Platforms               : none
    Ionic Framework                 : ionic-angular 3.5.0

System:

    Node       : v8.1.2
    OS         : Windows 10
    Xcode      : not installed
    ios-deploy : not installed
    ios-sim    : not installed
    npm        : 5.0.4
```
You need to ensure you've got Ionic Framework Version 3, as shown above.

Alternatively you can open `package.json` to ensure you've got the following angualr and Ionic versions

```json
"dependencies": {
    "@angular/common": "4.1.3",
    "@angular/compiler": "4.1.3",
    "@angular/compiler-cli": "4.1.3",
    "@angular/core": "4.1.3",
    "@angular/forms": "4.1.3",
    "@angular/http": "4.1.3",
    "@angular/platform-browser": "4.1.3",
    "@angular/platform-browser-dynamic": "4.1.3",
    "@ionic-native/core": "3.12.1",
    "@ionic-native/splash-screen": "3.12.1",
    "@ionic-native/status-bar": "3.12.1",
    "@ionic/storage": "2.0.1",
    "ionic-angular": "3.5.0",
    "ionicons": "3.0.0",
    "rxjs": "5.4.0",
    "sw-toolbox": "3.6.0",
    "zone.js": "0.8.12"
  },
  "devDependencies": {
    "@ionic/app-scripts": "1.3.12",
    "@ionic/cli-plugin-ionic-angular": "1.3.1",
    "typescript": "~2.3.4"
  }

```

If not, replace them to match above. These are the latest as of writing this tutorial.

To start your app, execute the following command

```bash

C:\projects\auth-ng4-ionic3-af2> ionic serve

```
If everything is installed correctly, the app should open your browser with the dev server running at following url
**`http://localhost:8100`** and will display default home page.

### Configuring AngularFire2 and Firebase

Install angularfire2 and firebase by executing the following command in your project directory

```ts

C:\projects\auth-ng4-ionic3-af2>npm install angularfire2 firebase --save

```

_This should add angularfire2 and firebase entry in your project's package.json file in dependencies section. Something similar_

> "angularfire2": "^4.0.0-rc.1",

> "firebase": "^4.1.3",

### Setup @NgModule

Open your project in your favourite editor and open the `app.module.ts` file, under `src/app`
and add the following three entries.

>1) Import AngularFireModule and AngularFireDatabaseModule at top.

>2) Define your firebaseConfig constant.

>3) Initialize your app, by adding AngularFireModule in the "imports" array in @NgModule

>3) Also, add AngularFireDatabaseModule in the "imports" array in @NgModule

your `app.module.ts` file should look something like this.

```typescript

import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

export const firebaseConfig = {
  apiKey: "xxxxxxxxxx",
  authDomain: "your-domain-name.firebaseapp.com",
  databaseURL: "https://your-domain-name.firebaseio.com",
  storageBucket: "your-domain-name.appspot.com",
  messagingSenderId: '<your-messaging-sender-id>'
};

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}

```

### Inject AngularFire and Bind it to List

Now inject AngularFireDatabase in your component. Open your `home.ts` by going into `src/pages/home/home.ts` and make the 
following changes:

>1) Import "AngularFireDatabase" at the top of your component.

>2) Inject your AngularFireDatabase dependency in the constructor.

>3) Call the list method on AngularFireDatabase object.

Your `home.ts` file should look like this.

```typescript

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  items: Observable<any[]>;

  constructor(public navCtrl: NavController, afDB: AngularFireDatabase) {
    this.items = afDB.list('cuisines').valueChanges();
  }

}

```

*_Ensure you've `cuisines` node in your database with some primitive data._

**Update** your `home.html` at `src/pages/home/home.html`, with following entry

```html

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
</ion-content>

```

**Run your app by executing the following command**

```bash

C:\projects\auth-ng4-ionic3-af2> ionic serve

```

This should fetch the data from firebase.


## Configuring Firebase/Facebook to talk to each other

Go to Facebook Developers Page [here](https://developers.facebook.com/apps/) and create a new App.

Once the App is created, get the `App ID` and `App Secret` from the dashboard and come back to _*Firebase Console*_.

1) Login to Firebase Console and click on the Authentication section on the left hand side of the menu.
2) Click on Sign-In Method tab and click on Facebook under Sign-In Providers. 
3) Paste the `App ID` and `App Secret` copied from Facebook dashboard here. 
4) Next copy the "OAuth redirect URI" from Firebase console. We need to go back and add it in Facebook dashboard. 

_This URI is important, since it tells facebook, where to redirect a user, once he is successfully authenticated._

5) Click the Save button and come back to the facebook dashboard.

Go to your app in Facebook developers site ( Facebook Dashboard )

6) Ensure you see `Facebook Login` under products section, if not add it via the Add Product Button. 
7) Once you see Facebook Login under products, click on the button to go to settings and there you should 
see "Valid OAuth redirect URIs" input field. 
8) Enter the URI copied from Firebase Console and click on Save Changes.

*_That's it. This will ensure Facebook and Firebase are able to talk to each other._*

`As we were able to fetch data from Firebase database in the above step, let's focus on authentication below, by 
removing calls to fetch data.`

*Let's add the following two buttons in our `home.html`*

The `home.html` should look like below

```html

<ion-header>
	<ion-navbar>
		<ion-title>
			Auth with Ionic
		</ion-title>
	</ion-navbar>
</ion-header>

<ion-content padding>
	<button ion-button outline (click)="signInWithFacebook()">Login</button>  
  <button ion-button outline (click)="signOut()">Logout</button>
</ion-content>

```

Let's update the `home.ts` to add the corresponding methods:

1) First import AngularFireAuth from AngularFire2/auth.
2) Inject AngularFireAuth in the constructor
3) The AngularFireAuth has various signIn methods to which we can pass instance of AuthProviders as shown below.

The `home.ts` should look like below

```typescript
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController,
    private afAuth: AngularFireAuth) { }

  signInWithFacebook() {
    this.afAuth.auth
      .signInWithPopup(new firebase.auth.FacebookAuthProvider())
      .then(res => console.log(res));
  }

  signOut() {
    this.afAuth.auth.signOut();
  }

}

```
**_Note the import of firebase from firebase/app, to take advantage of the tree-shaking_**

Also, update your `app.module.ts` to contain following import

`import { AngularFireAuthModule } from 'angularfire2/auth';`

and add it to the imports array.


Run the app and click on the Login Button, you should see a pop-up asking you to enter username and password for facebook to 
authenticate. Once authenticated, you should see the response from Facebook in console window.

Inspect the Object in the console, under `user` property, you should see all the attributes and we're going to use two of them, next.

Let's get the `displayName` from the `user` property, which we just saw on the console to be rendered on the screen.
The `AngularFireAuth` has an `authState` property, which returns an observable, let's subcribe it to get notified everytime the
Authentication state changes.

Add class property `displayName` and subscribe to the AngularFireAuth.authState property in the constructor. 
Also add the property in our template to render them on screen.

Your `home.ts` should look as follows:

```typescript

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  displayName;  

  constructor(public navCtrl: NavController,
    private afAuth: AngularFireAuth) {
    afAuth.authState.subscribe(user => {
      if (!user) {
        this.displayName = null;        
        return;
      }
      this.displayName = user.displayName;      
    });
  }

  signInWithFacebook() {
    this.afAuth.auth
      .signInWithPopup(new firebase.auth.FacebookAuthProvider())
      .then(res => console.log(res));
  }

  signOut() {
    this.afAuth.auth.signOut();
  }

}


```

and `home.html` shouldlook like this

```html

<ion-header>
	<ion-navbar>
		<ion-title>
			Auth with Ionic
		</ion-title>
	</ion-navbar>
</ion-header>

<ion-content padding>

  <h1>Hello {{displayName}}</h1>  
  
	<button ion-button outline (click)="signInWithFacebook()">Login</button>  
  <button ion-button outline (click)="signOut()">Logout</button>
</ion-content>

```

Now run your app and if everything is configured correctly, you should be able to click on the login button in your app, 
which should open the facebook pop-up.

Once you authenticate yourself, you should see your Facebook display name on your screen. 
Click the Logout button, which will make the AuthState to null and you should see the difference on your screen.

You can try redirecting yourself to another page to grab additional details from Facebook and experiement on your own.


***Running our application on mobile phone***

Ensure you've the platform added to your project. If not add the platform by executing the following command.

```

C:\projects\auth-ng4-ionic3-af2>ionic platform add android

```

This adds android platform for your project.
Replace android with ios, if you're on Mac book or add both. The generic command is ```ionic platform add <platform-name>```

Now, let's try to run the app in browser. Execute the command

```

C:\projects\auth-ng4-ionic3-af2> ionic run android

```

This should run the app on your mobile phone. Now click on the Facebook button and you'll notice the button doesn't work anymore.
This is because the code written so far is good for running our application in browsers, but when running the application on
mobile phones, we need to have access to ***Native Mobile API's***, which are provided by _Cordova Plugins_.

**We can access these cordova plugins, using Ionic Native, which are nothing but wrappers for cordova plugins.**

List of all Ionic Native API's for cordova plugins can be found [here](http://ionicframework.com/docs/v2/native/).

Let's look at configuring and installing facebook plugin [here](http://ionicframework.com/docs/v2/native/facebook/).
_Ensure you follow the steps correctly to configure your app._

Login to facebook dashboard [here](https://developers.facebook.com/apps/), go to your App and make a note of your App ID.
Next go to command prompt in your project directory and execute the following command by replacing the `APP_ID` with your App Id 
and `APP_NAME` with your App Name.

 ```bash
 
C:\projects\auth-ng4-ionic3-af2>
ionic cordova plugin add cordova-plugin-facebook4 --variable APP_ID="123456789" --variable APP_NAME="myApplication"

```

This should add following entry in your config.xml, located at the root of your project.

```xml

<plugin name="cordova-plugin-facebook4" spec="~1.7.4">
        <variable name="APP_ID" value="1689092456387654" />
        <variable name="APP_NAME" value="auth-ng4-ionic3-af2" />
</plugin>

```
This will install the cordova plugin for facebook. 

You should also see a sub-folder named `cordova-plugin-facebook4` under your `plugins` folder.

Add the native dependencies by executing the following command.

```bash

C:\projects\auth-ng4-ionic3-af2>npm install --save @ionic-native/facebook

```

After executing the above command, ensure you got following entry in your `package.json`

```bash

"@ionic-native/facebook": "^3.12.1",

```
Now import the `Platform` and `Facebook` objects in your `home.ts` and inject the objects in constructor.

```typescript

import { Platform } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';

```

Update the "signInWithFacebook" method and use Platform Service to determine the platform and run the appropriate code. 

your `home.ts` should look as below

```typescript

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

import { Platform } from 'ionic-angular';
import { Facebook } from '@ionic-native/facebook';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  displayName;

  constructor(public navCtrl: NavController,
    private afAuth: AngularFireAuth, private fb: Facebook, private platform: Platform) {
    afAuth.authState.subscribe((user: firebase.User) => {
      if (!user) {
        this.displayName = null;
        return;
      }
      this.displayName = user.displayName;      
    });
  }

  signInWithFacebook() {
    if (this.platform.is('cordova')) {
      return this.fb.login(['email', 'public_profile']).then(res => {
        const facebookCredential = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
        return firebase.auth().signInWithCredential(facebookCredential);
      })
    }
    else {
      return this.afAuth.auth
        .signInWithPopup(new firebase.auth.FacebookAuthProvider())
        .then(res => console.log(res));
    }
  }

  signOut() {
    this.afAuth.auth.signOut();
  }

}


```

You'll also need to add the "Facebook" object in the provider section in app.module.ts.

The final `app.module.ts` should look like below

```typescript

import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { Facebook } from '@ionic-native/facebook';

export const firebaseConfig = {
  apiKey: "xxxxxxxxxx",
  authDomain: "your-domain-name.firebaseapp.com",
  databaseURL: "https://your-domain-name.firebaseio.com",
  storageBucket: "your-domain-name.appspot.com",
  messagingSenderId: '<your-messaging-sender-id>'
};

@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    Facebook
  ]
})
export class AppModule {}


```

Verfiy your app is running in browser by executing the following command

```bash

C:\projects\auth-ng4-ionic3-af2>ionic serve

```

Everything should work. Now trying running the app on your android phone

```bash

C:\projects\auth-ng4-ionic3-af2> ionic cordova run android

```

Once the App launches click on the Login button. You should get the facebook pop-up window. Enter your credentials. 
On successful authentication, you should see your Facebook Display name and profile picture on your screen.
