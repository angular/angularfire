<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Realtime App Check
</small>

<img align="right" width="30%" src="images/reCAPTCHA-logo@1x.png">

# App Check

App Check helps protect your API resources from abuse by preventing unauthorized clients from accessing your backend resources. It works with both Firebase services, Google Cloud services, and your own APIs to keep your resources safe.

[Learn More](https://firebase.google.com/docs/app-check)

## Dependency Injection
As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide an App Check instance and configuration in the application's `NgModule` (`app.module.ts`):

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAppCheck } from '@angular/fire/app-check';

@NgModule({
  imports: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAppCheck(() => initializeAppCheck(getApp(), {
        provider: new ReCaptchaV3Provider(/* configuration */),
      })),
  ]
})
```

Next inject it into your component:

```ts
import { Component, inject} from '@angular/core';
import { AppCheck } from '@angular/fire/app-check';

@Component({ ... })
export class AppCheckComponent {
  private appCheck: AppCheck = inject(AppCheck);
  ...
}
```

## Firebase API

The [AppCheck documentation](https://firebase.google.com/docs/reference/js/app-check) is available on the Firebase website.

## Convenience observables
Coming soon.