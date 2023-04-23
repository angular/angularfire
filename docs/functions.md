<img align="right" width="30%" src="images/functions-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Realtime Cloud Functions
</small>

# Cloud Functions

The Cloud Functions for Firebase client SDKs let you call functions directly from a Firebase app. To call a function from your app in this way, write and deploy an HTTPS Callable function in Cloud Functions, and then add client logic to call the function from your app.

[Learn More](https://firebase.google.com/docs/functions/get-started)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide a Cloud Functions instance in the application's `NgModule` (`app.module.ts`):

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFunctions, provideFunctions } from '@angular/fire/functions';

@NgModule({
  imports: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFunctions(() => getFunctions()),
  ]
})
```

Next inject it into your component:

```ts
import { Component, inject} from '@angular/core';
import { Functions } from '@angular/fire/functions';

@Component({ ... })
export class AppComponent {
  private functions: Functions = inject(Functions);
  ...
}
```

## Firebase API
The [Firebase API for Cloud Functions documentation](https://firebase.google.com/docs/reference/js/functions) is available on the Firebase website.

## Convenience observables

More details coming soon.