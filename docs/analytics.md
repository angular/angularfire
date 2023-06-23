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

The [Firebase API for Google Analytics documentation](https://firebase.google.com/docs/reference/js/analytics.md#analytics_package) is available on the Firebase website.

## Services

### ScreenTrackingService

Coming soon, for now [please review the documentation](https://firebase.google.com/docs/analytics/screenviews)

### UserTrackingService
Coming soon

