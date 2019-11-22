# Getting started with Google Analytics

### Something, something

TBD

### Putting it all together

```ts
@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ],
  providers: [
    ScreenTrackingService,
    UserTrackingService
  ]
})
export class AppModule { }
```

```ts
constructor(analytics: AngularFireAnalytics) {
    analytics.logEvent('custom_event', { ... });
}
```