<img align="right" width="30%" src="images/remote-config-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Remote Config
</small>

# Remote Config

Firebase Remote Config is a cloud service that lets you change the behavior and appearance of your app without requiring users to download an app update.

[Learn More](https://firebase.google.com/docs/remote-config/)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide a Remote Config instance in the application's `app.config.ts`:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideRemoteConfig, getRemoteConfig } from '@angular/fire/remote-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideRemoteConfig(() => getRemoteConfig()),
    ...
  ],
  ...
})
```

Next inject `RemoteConfig` into your component:

```ts
import { Component, inject} from '@angular/core';
import { RemoteConfig } from '@angular/fire/remote-config';

@Component({ ... })
export class RemoteConfigComponent {
  private remoteConfig = inject(RemoteConfig);
  ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/remote-config'` to `import { ... } from '@angular/fire/remote-config'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/remote-config/get-started?platform=web) | [API Reference](https://firebase.google.com/docs/reference/js/remote-config)
