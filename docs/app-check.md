<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; App Check
</small>

<img align="right" width="30%" src="images/reCAPTCHA-logo@1x.png">

# App Check

App Check helps protect your API resources from abuse by preventing unauthorized clients from accessing your backend resources. It works with both Firebase services, Google Cloud services, and your own APIs to keep your resources safe.

[Learn More](https://firebase.google.com/docs/app-check)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project as described in the [Quickstart](./install-and-setup.md).

Provide an App Check instance in the application's `app.config.ts`:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideAppCheck(() => initializeAppCheck(getApp(), {
        provider: new ReCaptchaV3Provider(/* configuration */),
    })),
    ...
  ],
  ...
}
```

Next inject `AppCheck` it into your component:

```ts
import { Component, inject} from '@angular/core';
import { AppCheck } from '@angular/fire/app-check';

@Component({ ... })
export class AppCheckComponent {
  private appCheck = inject(AppCheck);
  ...
}
```

## Server-side rendering

App Check's reCAPTCHA providers need a browser. So while a page renders on the server, AngularFire does not call the function you pass to `provideAppCheck`, and no App Check instance is created there. On the server, `inject(AppCheck)` returns `null`, although its type says `AppCheck`. Code that runs on both the server and the browser should check the platform before using it.

### Firebase requests made during server rendering

With no App Check instance on the server, requests to Firebase made while the server renders a page carry no App Check token. If you [enforce App Check](https://firebase.google.com/docs/app-check/enable-enforcement) for a Firebase product, those requests are rejected. Firebase's recommended fix is to hand a token from the browser to the server and pass it to `initializeServerApp` as `appCheckToken`, described in [Use App Check in SSR environments](https://firebase.google.com/docs/web/ssr-apps#use-app-check).

### Running App Check during server rendering

If your app runs App Check on the server on purpose, with a provider that works outside the browser such as a `CustomProvider` backed by the Firebase Admin SDK, provide `APP_CHECK_ON_SERVER` in the server-only config:

```ts
// app.config.server.ts
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { APP_CHECK_ON_SERVER } from '@angular/fire/app-check';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: APP_CHECK_ON_SERVER, useValue: true },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

The function passed to `provideAppCheck` then runs on the server too, so it has to choose a provider that works there.

### AngularFire 21.0.0-rc.1 and earlier

These releases run App Check during server rendering, so the setup in [Dependency Injection](#dependency-injection) fails with `ReferenceError: document is not defined`. Keep `provideAppCheck` out of the config the server uses by moving it into a config only the browser loads:

```ts
// app.config.browser.ts
import { ApplicationConfig, inject, mergeApplicationConfig } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';
import { appConfig } from './app.config';

const browserConfig: ApplicationConfig = {
  providers: [
    provideAppCheck(() => initializeAppCheck(inject(FirebaseApp), {
      provider: new ReCaptchaV3Provider(/* configuration */),
    })),
  ]
};

export const config = mergeApplicationConfig(appConfig, browserConfig);
```

Then bootstrap the browser with that config in `main.ts`:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { config } from './app/app.config.browser';
import { App } from './app/app';

bootstrapApplication(App, config)
  .catch((err) => console.error(err));
```

The server then has no `AppCheck` provider at all, so inject it with `inject(AppCheck, { optional: true })`, which returns `null` on the server as later releases do.

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/app-check'` to `import { ... } from '@angular/fire/app-check'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/app-check/web/recaptcha-provider) | [API Reference](https://firebase.google.com/docs/reference/js/app-check)
