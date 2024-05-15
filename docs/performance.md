<img align="right" width="30%" src="images/performance-illo_1x.png">

<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Performance Monitoring
</small>

# Performance Monitoring

Firebase Performance Monitoring is a service that helps you to gain insight into the performance characteristics of your Apple, Android, and web apps.

[Learn More](https://firebase.google.com/docs/perf-mon)

## Dependency Injection

As a prerequisite, ensure that `AngularFire` has been added to your project via
```bash
ng add @angular/fire
```

Provide a Performance instance in the application's `app.config.ts`:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { providePerformance, getPerformance } from '@angular/fire/performance';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => initializeApp({ ... })),
    providePerformance(() => getPerformance()),
    ...
  ],
  ...
})
```

Next inject `Performance` into your component:

```ts
import { Component, inject} from '@angular/core';
import { Performance } from '@angular/fire/performance';

@Component({ ... })
export class PerformanceComponent {
  private performance = inject(Performance);
  ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/performance'` to `import { ... } from '@angular/fire/performance'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/perf-mon/get-started-web) | [API Reference](https://firebase.google.com/docs/reference/js/performance)
