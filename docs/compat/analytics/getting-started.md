# Getting started with Google Analytics

`AngularFireAnalytics` dynamically imports the `firebase/analytics` library and provides a promisified version of the [Firebase Analytics SDK (`firebase.analytics.Analytics`)](https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics.html).

> **NOTE**: [AngularFire has a new tree-shakable API](../../README.md#developer-guide), you're looking at the documentation for the compatability version of the library. [See the v7 upgrade guide for more information on this change.](../version-7-upgrade.md).

### API:

```ts
class AngularFireAnalytics {
  updateConfig(options: {[key:string]: any}): Promise<void>;

  // from firebase.analytics() proxy:
  logEvent(eventName: string, eventParams?: {[key: string]: any}, options?: analytics.AnalyticsCallOptions): Promise<void>;
  setCurrentScreen(screenName: string, options?: analytics.AnalyticsCallOptions): Promise<void>;
  setUserId(id: string, options?: analytics.AnalyticsCallOptions): Promise<void>;
  setUserProperties(properties: analytics.CustomParams, options?: analytics.AnalyticsCallOptions): Promise<void>;
  setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>;
  app: Promise<app.App>;
}

COLLECTION_ENABLED = InjectionToken<boolean>;
APP_VERSION = InjectionToken<string>;
APP_NAME = InjectionToken<string>;
DEBUG_MODE = InjectionToken<boolean>;
CONFIG = InjectionToken<Config>;
```

### Usage:

```ts
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ]
})
export class AppModule { }
```

`AngularFireAnalyticsModule` will dynamically import and configure `firebase/analytics`. A `page_view` event will automatically be logged (see `CONFIG` below if you wish to disable this behavior.)

In your component you can then dependency inject `AngularFireAnalytics` and make calls against the SDK:

```ts
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

constructor(analytics: AngularFireAnalytics) {
  analytics.logEvent('custom_event', { ... });
}
```

## Tracking Screen Views

You can log [`screen_view` events](https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics.html#parameters_10) yourself of course, but AngularFire provides the `ScreenTrackingService` which automatically integrates with the Angular Router to provide Firebase with screen view tracking. You simply can integrate like so:

```ts
import { AngularFireAnalyticsModule, ScreenTrackingService } from '@angular/fire/compat/analytics';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ],
  providers: [
    ScreenTrackingService
  ]
})
export class AppModule { }
```

`AngularFireAnalyticsModule` will initialize `ScreenTrackingService` if it is provided.

## Tracking User Identifiers

To enrich your Analytics data you can track the currently signed in user by setting [`setuserid`](https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics.html#setuserid) and [`setUserProperties`](https://firebase.google.com/docs/reference/js/firebase.analytics.Analytics.html#set-user-properties). AngularFire provides a `UserTrackingService` which will dynamically import `firebase/auth`, monitor for changes in the logged in user, and call `setuserid` for you automatically.


```ts
import { AngularFireAnalyticsModule, UserTrackingService } from '@angular/fire/compat/analytics';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ],
  providers: [
    UserTrackingService
  ]
})
export class AppModule { }
```

`AngularFireAnalyticsModule` will initialize `UserTrackingService` if it is provided.

## Configuration with Dependency Injection

### Configure Google Analtyics with `CONFIG`

Using the `CONFIG` DI Token (*default: {}*) will allow you to configure Google Analytics. E.g, you could skip sending the initial `page_view` event, anonymize IP addresses, and disallow ads personalization signals for all events like so:

```ts
import { AngularFireAnalyticsModule, CONFIG } from '@angular/fire/compat/analytics';

@NgModule({
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAnalyticsModule
  ],
  providers: [
    { provide: CONFIG, useValue: {
      send_page_view: false,
      allow_ad_personalization_signals: false,
      anonymize_ip: true
    } }
  ]
})
export class AppModule { }
```

See the gtag.js documentation to learn of the different configuration options at your disposal.

### Use DebugView `DEBUG_MODE`

To use [DebugView in Analytics](https://console.firebase.google.com/project/_/analytics/debugview) set `DEBUG_MODE` to `true` (*default: false*).

### Track deployments with `APP_NAME` and `APP_VERSION`

If you provide `APP_NAME` and `APP_VERSION` (*default: undefined*) you will be able to [track version adoption](https://console.firebase.google.com/project/_/analytics/latestrelease) of your PWA.

### Disable analytics collection via `COLLECTION_ENABLED`

If you set `COLLECTION_ENABLED` (*default: true*) to `false` then analytics collection will be disabled for this app on this device. To opt back in to analytics collection you could then call `setAnalyticsCollectionEnabled(true)`.

Putting these APIs to use with cookies would allow you to create a flexible analytics collection scheme that would respect your user's desire for privacy.
