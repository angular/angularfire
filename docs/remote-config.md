<img align="right" width="30%" src="images/remote-config-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Realtime Remote Config
</small>

# Remote Config

Firebase Remote Config is a cloud service that lets you change the behavior and appearance of your app without requiring users to download an app update.

[Learn More](https://firebase.google.com/docs/remote-config/)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide a Performance instance and configuration in the application's `NgModule` (`app.module.ts`):

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getRemoteConfig, provideRemoteConfig} from '@angular/fire/remote-config';

@NgModule({
  imports: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideRemoteConfig(() => getRemoteConfig()),
  ]
})
```

Next inject it into your component:

```ts
import { Component, inject} from '@angular/core';
import { RemoteConfig } from '@angular/fire/remote-config';

@Component({ ... })
export class RemoteConfigComponent {
  private remoteConfig: RemoteConfig = inject(RemoteConfig);
  ...
}
```

## Firebase API

The [Remote Config documentation](https://firebase.google.com/docs/reference/js/remote-config) is available on the Firebase website.

## Convenience observables

Coming soon.