# AngularFireFunctions

> The Cloud Functions for Firebase client SDKs let you call functions directly from a Firebase app. To call a function from your app in this way, write and deploy an HTTPS Callable function in Cloud Functions, and then add client logic to call the function from your app.

### Import the `NgModule`

Cloud Functions for AngularFire is contained in the `@angular/fire/functions` module namespace. Import the `AngularFireFunctionsModule` in your `NgModule`. This sets up the `AngularFireFunction` service for dependency injection.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFireFunctionsModule } from '@angular/fire/functions';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireFunctionsModule
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

### Injecting the AngularFireFunctions service

Once the `AngularFireFunctionsModule` is registered you can inject the `AngularFireFunctions` service.

```ts
import { Component } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

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
import { AngularFireFunctions } from '@angular/fire/functions';

@Component({
  selector: 'app-root',
  template: `{ data$  | async }`
})
export class AppComponent {
  constructor(private fns: AngularFireFunctions) { 
    const callable = fns.httpsCallable('my-fn-name');
    this.data$ = callable({ name: 'some-data' });
  }
}
```

Notice that calling `httpsCallable()` does not initiate the request. It creates a function, which when called creates an Observable, subscribe or convert it to a Promise to initiate the request.

## Configuration via Dependency Injection

### Functions Region

Allow configuration of the Function's region by adding `FUNCTIONS_REGION` to the `providers` section of your `NgModule`. The default is `us-central1`.

```ts
import { NgModule } from '@angular/core';
import { AngularFireFunctionsModule, FUNCTIONS_REGION } from '@angular/fire/functions';

@NgModule({
  imports: [
    ...
    AngularFireFunctionsModule,
    ...
  ],
  ...
  providers: [
   { provide: FUNCTIONS_REGION, useValue: 'asia-northeast1' }
  ]
})
export class AppModule {}

```

### Cloud Functions emulator

Point callable Functions to the Cloud Function emulator by adding `FUNCTIONS_ORIGIN` to the `providers` section of your `NgModule`.

```ts
import { NgModule } from '@angular/core';
import { AngularFireFunctionsModule, FUNCTIONS_ORIGIN } from '@angular/fire/functions';

@NgModule({
  imports: [
    ...
    AngularFireFunctionsModule,
    ...
  ],
  ...
  providers: [
   { provide: FUNCTIONS_ORIGIN, useValue: 'http://localhost:5005' }
  ]
})
export class AppModule {}

```