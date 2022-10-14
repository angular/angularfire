# AngularFireFunctions

> The Cloud Functions for Firebase client SDKs let you call functions directly from a Firebase app. To call a function from your app in this way, write and deploy an HTTPS Callable function in Cloud Functions, and then add client logic to call the function from your app.

### Import the `NgModule`

Cloud Functions for AngularFire is contained in the `@angular/fire/functions` module namespace. Import the `AngularFireFunctionsModule` in your `NgModule`. This sets up the `AngularFireFunction` service for dependency injection.

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

// AngularFire 7
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { provideFirestore, getFirestore } from '@angular/fire/firestore';
// import { provideFunctions, getFunctions, connectFunctionsEmulator } from '@angular/fire/functions'; // https://firebase.google.com/docs/emulator-suite/connect_functions#instrument_your_app_to_talk_to_the_emulators

// AngularFire 6
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireFunctionsModule } from '@angular/fire/compat/functions';
import { USE_EMULATOR } from '@angular/fire/compat/functions'; // comment out to run in the cloud

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,

    // AngularFire 7
    // provideFirebaseApp(() => initializeApp(environment.firebase)),
    // provideFirestore(() => getFirestore()),
    // provideFunctions(() => getFunctions()),

    // AngularFire 6
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireFunctionsModule
  ],
  providers: [
    { provide: USE_EMULATOR, useValue: ['localhost', 5001] } // comment out to run in the cloud
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Comment out two lines to run your functions in the cloud instead of in the Firebase emulator.

### Make an HTML view
```html
<div>
    <button mat-raised-button color="basic" (click)='callMe()'>Call me!</button>
</div>

{{ data$ | async }}
```

This view has a button for user input and displays the data returned from the cloud function.

### Injecting the AngularFireFunctions service

Once the `AngularFireFunctionsModule` is registered you can inject the `AngularFireFunctions` service.

```ts
import { Component } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

@Component({
  selector: 'app-component',
  template: ``
})
export class AppComponent {
  constructor(private fns: AngularFireFunctions) { }
}
```

### Creating a callable function

AngularFireFunctions is super easy. You create a function on the server side and then "call" it by its name with the client library. 

| method   |                    |
| ---------|--------------------|
| `httpCallable(name: string): (data: T) ` | Creates a callable function based on a function name. Returns a function that can create the observable of the http call. |

```ts
import { Component } from '@angular/core';

// AngularFire 7
// import { getApp } from '@angular/fire/app';
// import { provideFunctions, getFunctions, connectFunctionsEmulator, httpsCallable } from '@angular/fire/functions'; // https://firebase.google.com/docs/emulator-suite/connect_functions#instrument_your_app_to_talk_to_the_emulators
// import { Firestore, doc, getDoc, getDocs, collection, updateDoc } from '@angular/fire/firestore';

// AngularFire 6
import { AngularFireFunctions } from '@angular/fire/compat/functions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  data$: any;

  constructor(private functions: AngularFireFunctions) {
    const callable = this.functions.httpsCallable('executeOnPageLoad');
    this.data$ = callable({ name: 'Charles Babbage' });
  }

  callMe() {
    console.log("Calling...");
    const callable = this.functions.httpsCallable('callMe');
    this.data$ = callable({ name: 'Ada Lovelace' });
  };
}
```

`data$` handles the data returned from the cloud function and displays the data in the view.

The component handles two functions, one that executes on page load and another that executes on user input.

Notice that calling `httpsCallable()` does not initiate the request. It creates a function, which when called creates an Observable, subscribe or convert it to a Promise to initiate the request.

### Make your callable cloud functions

```js
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// executes on page load
exports.executeOnPageLoad = functions.https.onCall((data, context) => {
    console.log("The page is loaded!")
    console.log(data);
    console.log(data.name);
    // console.log(context);
    return 22
});

// executes on user input
exports.callMe = functions.https.onCall((data, context) => {
    console.log("Thanks for calling!")
    console.log(data);
    console.log(data.name);
    // console.log(context);
    return 57
});
```

The first function executes when the page loads. The second function executes from user input. 

Both functions use `https.onCall((data, context) => {})`, which makes a function callable from Angular.

`data` is the data sent from Angular. `context` is metadata about the function executing. The returned data (`22`, `57`) goes back to Angular and is displayed in the view. This data is an Observable.

## Configuration via Dependency Injection

### Functions Region

Allow configuration of the Function's region by adding `REGION` to the `providers` section of your `NgModule`. The default is `us-central1`.

```ts
import { NgModule } from '@angular/core';
import { AngularFireFunctionsModule, REGION } from '@angular/fire/compat/functions';

@NgModule({
  imports: [
    ...
    AngularFireFunctionsModule,
    ...
  ],
  ...
  providers: [
   { provide: REGION, useValue: 'asia-northeast1' }
  ]
})
export class AppModule {}

```

### Cloud Functions emulator

Point callable Functions to the Cloud Function emulator by adding `USE_EMULATOR` to the `providers` section of your `NgModule`.

```ts
import { NgModule } from '@angular/core';
import { AngularFireFunctionsModule, USE_EMULATOR } from '@angular/fire/compat/functions';

@NgModule({
  imports: [
    ...
    AngularFireFunctionsModule,
    ...
  ],
  ...
  providers: [
   { provide: USE_EMULATOR, useValue: ['localhost', 5001] }
  ]
})
export class AppModule {}

```

[Learn more about integration with the Firebase Emulator suite on our dedicated guide here](../emulators/emulators.md).

### Firebase Hosting integration

If you serve your app using [Firebase Hosting](https://firebase.google.com/docs/hosting/), you can configure Functions to be served from the same domain as your app. This will avoid an extra round-trip per function call due to [CORS preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request). This only applies to sites hosted via firebase on `us-central1`.

To set this up, you first need to update your `hosting` section in `firebase.json` and add one `rewrite` rule per function:

```json
  "hosting": {
    "rewrites": [
      {
        "source": "/someFunction",
        "function": "someFunction"
      },
      {
        "source": "/anotherFunction",
        "function": "anotherFunction"
      },
      ...
    ]
  }
```

Deploy your hosting project to the new settings go into effect, finally configure functions origin to point at your app domain:

```ts
import { NgModule } from '@angular/core';
import { AngularFireFunctionsModule, ORIGIN, NEW_ORIGIN_BEHAVIOR } from '@angular/fire/compat/functions';

@NgModule({
  imports: [
    ...
    AngularFireFunctionsModule,
    ...
  ],
  ...
  providers: [
   { provide: NEW_ORIGIN_BEHAVIOR, useValue: true },
   { provide: ORIGIN, useValue: 'https://project-name.web.app' }
  ]
})
export class AppModule {}

```
