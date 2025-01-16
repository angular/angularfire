<small>
<a href="https://github.com/angular/angularfire">AngularFire</a> &#10097; <a href="../README.md#developer-guide">Developer Guide</a> &#10097; Zone Wrappers
</small>

# Zone Wrappers

AngularFire wraps the [framework agnostic Firebase JS SDK](https://github.com/firebase/firebase-js-sdk) and [RxFire](https://github.com/firebaseextended/rxfire) to ensure proper functionality in Zone and Zoneless applications alike.

These wrappers ensure Firebase APIs are called outside of the Angular zone. This isolates side-effects such as timers so that they do not destabilize your application. 

Observables, Promise-based APIs, and those with callbacks will purposely destabilize your application until a initial value is returned, this ensures that server-side rendering (SSR) and static site generation (SSG/pre-rendering) wait for data before rendering the page's HTML.

## Consequences of not Zone wrapping

When using a Firebase or RxFire API without importing from AngularFire or if AngularFire APIs are used outside of an injection context you _may_ experience instability.

When an application is unstable change-detection, two-way binding, and rehydration may not work as expected—leading to both subtle and non-subtle bugs in your application. Further, server-side rendering (SSR) and static site generation (SSG/pre-rendering) may timeout or render a blank page.

There are a number of situations where AngularFire's Zone wrapping is inconsequential such adding/deleting/updating a document in response to user-input, signing a user in, calling a Cloud Function, etc. So long as no long-lived side-effects are kicked off, your application should be ok. Most Promise based APIs are fairly safe without zone wrapping. 

## Logging

You may see a log warning, `Calling Firebase APIs outside of an Injection context may destabilize your application leading to subtle change-detection and hydration bugs. Find more at https://github.com/angular/angularfire/blob/main/docs/zones.md` when developing your application.

Instability can be difficult to track down. To help with debugging, AngularFire emits warnings when it is unable to Zone wrap an API while in dev-mode. **Often these messages can be safely ignored** but we'd rather be verbose.

There are three logging levels in AngularFire:

* **Silent**: when the logging level is set to silent only the above banner is displayed when AngularFire APIs are called outside of an injection context, this is the default when using Zoneless change-detection.
* **Warn**: when the logging level is set to warn, only blocking reads, long-lived tasks, and APIs with high risk of destabilizing your application are called, this is the default when using ZoneJS.
* **Verbose**: when the logging level is set to verbose, all AngularFire APIs called outside of an injection context are logged—helping you track down APIs that may be destabilizing your application

You can change the log-level like so:

```ts
import { setLogLevel, LogLevel } from "@angular/fire";

setLogLevel(LogLevel.VERBOSE);
```