# Getting started with Performance Monitoring

> **NOTE**: [AngularFire has a new tree-shakable API](../../../README.md#developer-guide), you're looking at the documentation for the compatability version of the library. [See the v7 upgrade guide for more information on this change.](../../version-7-upgrade.md).

## Automatic page load tracing

Understand your Angular application's real-world performance with [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon). Performance Monitoring automatically provides a trace for **page load** when you add `AngularFirePerformanceModule` into your App Module's imports.

```ts
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirePerformanceModule, PerformanceMonitoringService } from '@angular/fire/compat/performance';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirePerformanceModule,
    ...
  ],
  providers: [
    PerformanceMonitoringService
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}
```

The page load trace breaks down into the following default metrics:

* [first paint traces](https://firebase.google.com/docs/perf-mon/automatic-web#first-paint) — measure the time between when the user navigates to a page and when any visual change happens
* [first contentful paint traces](https://firebase.google.com/docs/perf-mon/automatic-web#contentful-paint) — measure the time between when a user navigates to a page and when meaningful content displays, like an image or text
* [domInteractive traces](https://firebase.google.com/docs/perf-mon/automatic-web#domInteractive) — measure the time between when the user navigates to a page and when the page is considered interactive for the user
* [domContentLoadedEventEnd traces](https://firebase.google.com/docs/perf-mon/automatic-web#domContentLoaded) — measure the time between when the user navigates to a page and when the initial HTML document is completely loaded and parsed
* [loadEventEnd traces](https://firebase.google.com/docs/perf-mon/automatic-web#loadEventEnd) — measure the time between when the user navigates to the page and when the current document's load event completes
* [first input delay traces](https://firebase.google.com/docs/perf-mon/automatic-web#input-delay) — measure the time between when the user interacts with a page and when the browser is able to respond to that input
* **Angular specific traces** - `PerformanceMonitoringService` will measure the time needed for `ApplicationRef.isStable` to be true, an important metric to track if you're concerned about solving Zone.js issues for proper functionality of NGSW and Server Side Rendering

### Measuring First Input Delay

> First Input Delay (FID) measures the time from when a user first interacts with your site (i.e. when they click a link, tap on a button, or use a custom, JavaScript-powered control) to the time when the browser is actually able to respond to that interaction. [See the article on the Google Developer's Blog for more information on FID.](https://developers.google.com/web/updates/2018/05/first-input-delay)

In order to track first input delay, you'll want to [polyfill the browser performance API](https://github.com/GoogleChromeLabs/first-input-delay):

`npm install --save-dev first-input-delay`

Then add `import 'first-input-delay';` to your `src/polyfills.ts`.

## Manual traces

You can inject `AngularFirePerformance` to perform manual traces.

```ts
constructor(private performance: AngularFirePerformance) {}

...

const trace = await this.performance.trace('some-trace');
trace.start();
...
trace.stop();
```

## RXJS operators

AngularFire provides a number of RXJS operators which wrap the User Timing API. These are picked up by performance monitoring tools such as Chrome Inspector and Firebase Performance Monitoring.

```ts
import { trace } from '@angular/fire/compat/performance';

...

constructor(private performance: AngularFirePerformance, private afs: AngularFirestore) {}

ngOnInit() {
  this.articles = afs.collection('articles')
      .collection('articles', ref => ref.orderBy('publishedAt', 'desc'))
      .snapshotChanges()
      .pipe(
        // measure the amount of time between the Observable being subscribed to and first emission (or completion)
        trace('getArticles'),
        map(articles => ...)
      );
}
```

### `trace(name: string)`

The most basic operator, `trace` will measure the amount of time it takes for your observable to either complete or emit its first value. Beyond the basic trace there are several other operators:

<h3>
<pre>
traceUntil(
  name: string,
  test: (T) => Boolean,
  options?: { orComplete?: true }
)
</pre>
</h3>

Trace the observable until the first emission that passes the provided test.

If the `orComplete` option is passed it will complete the trace when the observable completes, even if an emission never passed the provided test.

<h3>
<pre>
traceWhile(
  name: string,
  test: (T) => Boolean,
  options?: { orComplete?: true }
)
</pre>
</h3>

Starting with an emission that passes the provided test, trace until an emission fails the test.

If the `orComplete` option is passed it will complete any existing trace when the observable completes.

### `traceUntilLast(name: string)`

Trace the observable until completion.

### `traceUntilFirst(name: string)`

Traces the observable until the first emission.

## Advanced usage

### Configuration via Dependency Injection

Set `INSTRUMENTATION_ENABLED` or `DATA_COLLECTION_ENABLED` to false disable all automatic and custom traces respectively.