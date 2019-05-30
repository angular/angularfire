# Getting started with Performance Monitoring

## Automatic page load tracing

Understand your Angular application's real-world performance with [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon). Performance Monitoring automatically provides a trace for **page load** when you add `AngularFirePerformanceModule` into your App Module's imports.

```ts
import { AngularFireModule } from '@angular/fire';
import { AngularFirePerformanceModule } from '@angular/fire/performance';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirePerformanceModule,
    ...
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
* **Angular specific traces** - measure the time needed for `ApplicationRef.isStable` to be true, an important metric to track if you're concerned about solving Zone.js issues for proper functionality of NGSW and Server Side Rendering

## Manual traces

You can inject `AngularFirePerformance` to perform manual traces on Observables.

```ts
constructor(private afp: AngularFirePerformance, private afs: AngularFirestore) {}

ngOnInit() {
  this.articles = afs.collection('articles')
      .collection('articles', ref => ref.orderBy('publishedAt', 'desc'))
      .snapshotChanges()
      .pipe(
        // measure the amount of time between the Observable being subscribed to and first emission (or completion)
        this.afp.trace('getArticles'),
        map(articles => ...)
      );
}
```

### `trace(name: string, options?: TraceOptions)`

The most basic operator, `trace` will measure the amount of time it takes for your observable to either complete or emit its first value. Beyond the basic trace there are several other operators:

<h3>
<pre>
traceUntil(
  name: string,
  test: (T) => Boolean,
  options?: TraceOptions & { orComplete?: true }
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
  options?: TraceOptions & { orComplete?: true }
)
</pre>
</h3>

Starting with an emission that passes the provided test, trace until an emission fails the test.

If the `orComplete` option is passed it will complete any existing trace when the observable completes.

### `traceUntilLast(name: string, options?: TraceOptions)`

Trace the observable until completion.

### `traceUntilFirst(name: string, options?: TraceOptions)`

Traces the observable until the first emission.

## Advanced usage

### Configuration via Dependency Injection

By default, `AngularFirePerformanceModule` traces your Angular application's time to `ApplicationRef.isStable`. `isStable` is an important metric to track if you're concerned about proper functionality of NGSW and Server Side Rendering. If you want to opt-out of the tracing of this metric use the `AUTOMATICALLY_TRACE_CORE_NG_METRICS` injection token:

```ts
import { NgModule } from '@angular/core';
import { AngularFirePerformanceModule, AUTOMATICALLY_TRACE_CORE_NG_METRICS } from '@angular/fire/functions';

@NgModule({
  imports: [
    ...
    AngularFirePerformanceModule,
    ...
  ],
  ...
  providers: [
   { provide: AUTOMATICALLY_TRACE_CORE_NG_METRICS, useValue: false }
  ]
})
export class AppModule {}
```

Similarly, setting `INSTRUMENTATION_ENABLED` or `DATA_COLLECTION_ENABLED` to false disable all automatic and custom traces respectively.

### Get at an observable form of trace

`trace$(name:string)` provides an observable version of `firebase/perf`'s `.trace` method; the basis for `AngularFirePerfomance`'s pipes.

`.subscribe()` is equivalent to calling `.start()`
`.unsubscribe()` is equivalent to calling `.stop()`

### Using `TraceOptions` to collect additional metrics

`TraceOptions` can be provided to the aformentioned operators to collect custom metrics and attributes on your traces:

```ts
type TraceOptions = {
  metrics?: { [key:string]: number },
  attributes?: { [key:string]: string },
  attribute$?: { [key:string]: Observable<string> },
  incrementMetric$: { [key:string]: Observable<number|void|null|undefined> },
  metric$?: { [key:string]: Observable<number> }
};
```

#### Usage:

```ts
const articleLength$ = this.articles.pipe(
  map(actions => actions.length)
);

const articleSize$ = this.articles.pipe(
  map(actions => actions.reduce((sum, a) => sum += JSON.stringify(a.payload.doc.data()).length))
)

this.articles = afs.collection('articles')
      .collection('articles', ref => ref.orderBy('publishedAt', 'desc'))
      .snapshotChanges()
      .pipe(
        this.afp.trace('getArticles', {
          attributes: { gitSha: '1d277f823ad98dd739fb86e9a6c440aa8237ff3a' },
          metrics: { something: 42 },
          metrics$: { count: articleLength$, size: articleSize$ },
          attributes$: { user: this.afAuth.user },
          incrementMetric$: { buttonClicks: fromEvent(button, 'click') }
        }),
        share()
      );
```