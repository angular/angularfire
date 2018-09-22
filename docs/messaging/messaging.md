# AngularFireMessaging

> The FCM JavaScript API lets you receive notification messages in web apps running in browsers that support the Push API.

### AngularFireMessaging is not compatible with the Angular Service Worker

If you are using the Angular Service Worker, you are not currently able to use AngularFireMessaging. If you'd like this feature please file an issue in [either repository](https://github.com/angular/angular/tree/master/packages/service-worker). Your alternatives are to use [WorkboxJS](https://developers.google.com/web/tools/workbox/) or just simply use the Firebase Messaging Service Worker, which is detailed below.

### Import the `NgModule`

Cloud Storage for AngularFire is contained in the `@angular/fire/messaging` module namespace. Import the `AngularFireMessagingModule` in your `NgModule`. This sets up the `AngularFireMessaging` service for dependency injection.

```ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireMessagingModule
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

### Setting up the Firebase Messaging Service Worker

There are two parts Firebase Messaging, a Service Worker and the DOM API. AngularFireMessaging allows you to request permission, get tokens, delete tokens, and subscribe to messages on the DOM side. To register to receive notifications you need to set up the Service Worker. [The official Firebase documentation for setting up the details exactly how to do that](https://firebase.google.com/docs/cloud-messaging/js/client). 

You can either use the `firebase-messaging-sw.js` file provided in the docs or you can set your own Service Worker to import that script. Make sure to set up your `.angular-cli.json` file to copy over the Service Worker file:

```json
  "assets": [
    "assets",
    "favicon.ico",
    "firebase-messaging-sw.js",
    "manifest.json"
  ],
```

### Requesting permission

Once you have the Firebase Messaging Service Worker setup and installed, you need to request permission to send a user notifications. While the browser will popup a UI for you, it is highly recommend to ask the user for permission with a custom UI and only ask when it makes sense. If you blindly ask for permission you have an extremely high chance of getting denied.

```ts
import { Component } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';

@Component({
  selector: 'app-root',
  template: `
  <button (click)="requestPermission()">
    Hey this is a chat app, you should let us send you notifications for these reasons!
  </button>
  `
})
export class AppComponent {
  constructor(private afMessaging: AngularFireMessaging) { }
  requestPermission() {
    this.afMessaging.requestPermission
      .subscribe(
        () => { console.log('Permission granted!'); },
        (error) => { console.error(error); },  
      );
  }
}
```

Once you have the permission of the user, you need their token. You can do this with the `getToken` observable or the `tokenChanges` observable. The `tokenChanges` observable listens for token refreshes whereas the `getToken` observable is a one-time call.

```ts
import { Component } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { mergeMapTo } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
  <button (click)="requestPermission()">
    Hey this is a chat app, you should let us send you notifications for these reasons!
  </button>
  `
})
export class AppComponent {
  constructor(private afMessaging: AngularFireMessaging) { }
  requestPermission() {
    this.afMessaging.requestPermission
      .pipe(mergeMapTo(this.afMessaging.tokenChanges))
      .subscribe(
        (token) => { console.log('Permission granted! Save to the server!', token); },
        (error) => { console.error(error); },  
      );
  }
}
```

Once you have a user's token, you need to save it to the server in order to send them notifications in response to events. Let's say ou want to send a push each time a user sends a chat message. Once a user grants permission, you can send the token to the Realtime Database or Cloud Firestore and associate it with a unique id, like a Firebase Auth UID. You can then create a Cloud Function trigger that looks up the user's token when a chat message is created.

### Shortcutting token requests

An easier way of requesting permission and getting tokens is with the `requestToken` observable. It combines the two steps above into one observable.

```ts
import { Component } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';

@Component({
  selector: 'app-root',
  template: `
  <button (click)="requestPermission()">
    Hey this is a chat app, you should let us send you notifications for these reasons!
  </button>
  `
})
export class AppComponent {
  constructor(private afMessaging: AngularFireMessaging) { }
  requestPermission() {
    this.afMessaging.requestToken
      .subscribe(
        (token) => { console.log('Permission granted! Save to the server!', token); },
        (error) => { console.error(error); },  
      );
  }
}
```

The `requestToken` observable uses the `tokenChanges` observable to listen to refreshes.

### Deleting tokens

Need to delete a user's token? Not a problem.

```ts
import { Component } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
  <button (click)="deleteMyToken()">
    Delete my token plz
  </button>
  `
})
export class AppComponent {
  constructor(private afMessaging: AngularFireMessaging) { }
  deleteToken() {
    this.afMessaging.getToken
      .pipe(mergeMap(token => this.afMessaging.deleteToken(token)))
      .subscribe(
        (token) => { console.log('Deleted!'); },
      );
  }
}
```

The code above requests the current user's token and passes it to the `deleteToken()` observable.

### Subscribing to foreground messages

Once you have a user's token and they are subscribed, you can listen to messages in the foreground. The Firebase Messaging Service Worker handles background push notifications.

```ts
import { Component } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';

@Component({
  selector: 'app-root',
  template: `
  <button (click)="listen()">
    Get notified!
  </button>
  `
})
export class AppComponent {
  constructor(private afMessaging: AngularFireMessaging) { }
  listen() {
    this.afMessaging.messages
      .subscribe((message) => { console.log(message); });
  }
}
```

### Sending notifications

[Sending a notification](https://firebase.google.com/docs/cloud-messaging/js/first-message) requires a call to a server. You can do this directly with an HTTP call or you can even build a Cloud Function to do this in response to an event. A Cloud Function trigger is ideal because you have trusted access to the database and can securely look up tokens to send to the right user. If you want to send push notifications via HTTP requests you'll need to secure the API call. This is usually done with a Firebase Auth UID. On the server you can verify the UID with the Firebase Admin SDK and allow access to get a user's push id.

The [Firebase Admin SDK has helper functions for sending notifications](https://firebase.google.com/docs/cloud-messaging/admin/send-messages) to the user and subscribing them to topics, which [simplifies sending grouped messages](https://firebase.google.com/docs/cloud-messaging/admin/manage-topic-subscriptions).
