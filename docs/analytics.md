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

Provide a Google Analytics instance in the application's `NgModule` (`app.module.ts`):

```ts
@NgModule({
  declarations: [
    ...
  ],
  imports: [
    ...
    // App initialization
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics())
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

In your component class, for example `user-profile.component.ts` import and inject `Firestore`:

```typescript
import { Component, inject } from '@angular/core';
import { Analytics } from '@angular/fire/analytics';

@Component({
    standalone: true,
    selector: 'app-user-profile',
    ...
})
export class UserProfileComponent {
    private analytics: Analytics = inject(Analytics);
    ...
}
```

## Firebase API

AngularFire wraps the Firebase JS SDK to ensure proper functionality in Angular, while providing the same API.

Update the imports from `import { ... } from 'firebase/analytics'` to `import { ... } from '@angular/fire/analytics'` and follow the official documentation.

[Getting Started](https://firebase.google.com/docs/analytics/get-started?platform=web) | [API Reference](https://firebase.google.com/docs/reference/js/analytics)
