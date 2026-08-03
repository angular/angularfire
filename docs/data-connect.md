<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Data Connect
</small>

# Data Connect

Firebase Data Connect (now known as "Firebase SQL Connect" in the Firebase documentation) is a backend service that pairs a Cloud SQL for PostgreSQL database with GraphQL, generating type-safe SDKs to query and mutate your data.

[Learn more](https://firebase.google.com/docs/data-connect)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide a Data Connect instance in the application's `app.config.ts`. `getDataConnect` takes a connector config that identifies your service, connector, and location; this is generated for you when you set up Data Connect and is also exported from your generated SDK:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDataConnect, getDataConnect } from '@angular/fire/data-connect';

const connectorConfig = {
  connector: 'my-connector',
  service: 'my-service',
  location: 'us-central1',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideDataConnect(() => getDataConnect(connectorConfig)),
    ...
  ],
  ...,
}
```

Next inject `DataConnect` into your component:

```typescript
import { Component, inject } from '@angular/core';
import { DataConnect } from '@angular/fire/data-connect';

@Component({ ... })
export class MyComponent {
    private dataConnect = inject(DataConnect);
    ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/data-connect'` to `import { ... } from '@angular/fire/data-connect'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/data-connect/quickstart)
