<img align="right" width="30%" src="images/analytics-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Analytics
</small>

# Analytics

Google Analytics is an app measurement solution, available at no charge, that provides insight on app usage and user engagement.

[Learn more](https://firebase.google.com/docs/analytics)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide a Analytics instance in the application's `app.config.ts`:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAnalytics, getAnalytics } from '@angular/fire/analytics';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    provideAnalytics(() => getAnalytics()),
    ...
  ],
  ...,
}
```

Next inject `Analytics` into your component:

```typescript
import { Component, inject } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';

@Component({ ... })
export class UserProfileComponent {
    private analytics = inject(Analytics);
    ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/analytics'` to `import { ... } from '@angular/fire/analytics'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/analytics/get-started?platform=web) | [API Reference](https://firebase.google.com/docs/reference/js/analytics)
