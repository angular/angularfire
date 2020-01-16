import { Injectable, NgZone, ApplicationRef, InjectionToken, Inject, Optional } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { first, tap, map, shareReplay, switchMap } from 'rxjs/operators';
import { performance } from 'firebase/app';
import { FirebaseApp, ɵPromiseProxy, ɵlazySDKProxy } from '@angular/fire';

// SEMVER @ v6, drop and move core ng metrics to a service
export const AUTOMATICALLY_TRACE_CORE_NG_METRICS = new InjectionToken<boolean>('angularfire2.performance.auto_trace');
export const INSTRUMENTATION_ENABLED = new InjectionToken<boolean>('angularfire2.performance.instrumentationEnabled');
export const DATA_COLLECTION_ENABLED = new InjectionToken<boolean>('angularfire2.performance.dataCollectionEnabled');

export interface AngularFirePerformance extends Omit<ɵPromiseProxy<performance.Performance>, 'trace'> {};

export type TraceOptions = {
  metrics?: {[key:string]: number},
  attributes?: {[key:string]:string},
  attribute$?: {[key:string]:Observable<string>},
  incrementMetric$?: {[key:string]: Observable<number|void|null|undefined>},
  metric$?: {[key:string]: Observable<number>}
};

@Injectable({
  providedIn: 'root'
})
export class AngularFirePerformance {
  
  private readonly performance: Observable<performance.Performance>;

  constructor(
    app: FirebaseApp,
    @Optional() @Inject(AUTOMATICALLY_TRACE_CORE_NG_METRICS) automaticallyTraceCoreNgMetrics:boolean|null,
    @Optional() @Inject(INSTRUMENTATION_ENABLED) instrumentationEnabled:boolean|null,
    @Optional() @Inject(DATA_COLLECTION_ENABLED) dataCollectionEnabled:boolean|null,
    appRef: ApplicationRef,
    private zone: NgZone
  ) {

    this.performance = of(undefined).pipe(
      switchMap(() => zone.runOutsideAngular(() => import('firebase/performance'))),
      map(() => zone.runOutsideAngular(() => app.performance())),
      tap(performance => {
        if (instrumentationEnabled == false) { performance.instrumentationEnabled = false }
        if (dataCollectionEnabled == false) { performance.dataCollectionEnabled = false }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    if (automaticallyTraceCoreNgMetrics != false) {

      // TODO determine more built in metrics
      // this leaks... move to a service?
      appRef.isStable.pipe(
        first(it => it),
        this.traceUntilComplete('isStable')
      ).subscribe();

    }

    return ɵlazySDKProxy(this, this.performance, zone);

  }

  private readonly trace$ = (name:string, options?: TraceOptions) =>
    this.performance.pipe(
      switchMap(performance =>
        new Observable<void>(emitter =>
          this.zone.runOutsideAngular(() => {
            const trace = performance.trace(name);
            options && options.metrics && Object.keys(options.metrics).forEach(metric => {
              trace.putMetric(metric, options!.metrics![metric])
            });
            options && options.attributes && Object.keys(options.attributes).forEach(attribute => {
              trace.putAttribute(attribute, options!.attributes![attribute])
            });
            const attributeSubscriptions = options && options.attribute$ ? Object.keys(options.attribute$).map(attribute =>
              options!.attribute$![attribute].subscribe(next => trace.putAttribute(attribute, next))
            ) : [];
            const metricSubscriptions = options && options.metric$ ? Object.keys(options.metric$).map(metric =>
              options!.metric$![metric].subscribe(next => trace.putMetric(metric, next))
            ) : [];
            const incrementOnSubscriptions = options && options.incrementMetric$ ? Object.keys(options.incrementMetric$).map(metric =>
              options!.incrementMetric$![metric].subscribe(next => trace.incrementMetric(metric, next || undefined))
            ) : [];
            emitter.next(trace.start());
            return { unsubscribe: () => {
              trace.stop();
              metricSubscriptions.forEach(m => m.unsubscribe());
              incrementOnSubscriptions.forEach(m => m.unsubscribe());
              attributeSubscriptions.forEach(m => m.unsubscribe());
            }};
          })
        )
      )
    );

  public readonly traceUntil = <T=any>(name:string, test: (a:T) => boolean, options?: TraceOptions & { orComplete?: boolean }) => (source$: Observable<T>) => new Observable<T>(subscriber => {
    const traceSubscription = this.trace$(name, options).subscribe();
    return source$.pipe(
      tap(
        a  => test(a) && traceSubscription.unsubscribe(),
        () => {},
        () => options && options.orComplete && traceSubscription.unsubscribe()
      )
    ).subscribe(subscriber);
  });

  public readonly traceWhile = <T=any>(name:string, test: (a:T) => boolean, options?: TraceOptions & { orComplete?: boolean}) => (source$: Observable<T>) => new Observable<T>(subscriber => {
    let traceSubscription: Subscription|undefined;
    return source$.pipe(
      tap(
        a  => {
          if (test(a)) {
            traceSubscription = traceSubscription || this.trace$(name, options).subscribe();
          } else {
            traceSubscription && traceSubscription.unsubscribe();
            traceSubscription = undefined;
          }
        },
        () => {},
        () => options && options.orComplete && traceSubscription && traceSubscription.unsubscribe()
      )
    ).subscribe(subscriber);
  });

  public readonly traceUntilComplete = <T=any>(name:string, options?: TraceOptions) => (source$: Observable<T>) => new Observable<T>(subscriber => {
    const traceSubscription = this.trace$(name, options).subscribe();
    return source$.pipe(
      tap(
        () => {},
        () => {},
        () => traceSubscription.unsubscribe()
      )
    ).subscribe(subscriber);
  });

  public readonly traceUntilFirst = <T=any>(name:string, options?: TraceOptions) => (source$: Observable<T>) => new Observable<T>(subscriber => {
    const traceSubscription = this.trace$(name, options).subscribe();
    return source$.pipe(
      tap(
        () => traceSubscription.unsubscribe(),
        () => {},
        () => {}
      )
    ).subscribe(subscriber);
  });

  public readonly trace = <T=any>(name:string, options?: TraceOptions) => (source$: Observable<T>) => new Observable<T>(subscriber => {
    const traceSubscription = this.trace$(name, options).subscribe();
    return source$.pipe(
      tap(
        () => traceSubscription.unsubscribe(),
        () => {},
        () => traceSubscription.unsubscribe()
      )
    ).subscribe(subscriber);
  });

}
