import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { EMPTY, Observable, of, Subscription } from 'rxjs';
import { map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { FirebasePerformance, initializePerformance } from 'firebase/performance';
import { FirebaseApp, ɵapplyMixins, ɵlazySDKProxy, ɵPromiseProxy } from '@angular/fire';
import { isPlatformBrowser } from '@angular/common';
import { proxyPolyfillCompat } from './base';
import { ɵfetchInstance } from '@angular/fire';

// SEMVER @ v6, drop and move core ng metrics to a service
export const AUTOMATICALLY_TRACE_CORE_NG_METRICS = new InjectionToken<boolean>('angularfire2.performance.auto_trace');
export const INSTRUMENTATION_ENABLED = new InjectionToken<boolean>('angularfire2.performance.instrumentationEnabled');
export const DATA_COLLECTION_ENABLED = new InjectionToken<boolean>('angularfire2.performance.dataCollectionEnabled');

export interface AngularFirePerformance extends ɵPromiseProxy<FirebasePerformance> {
}

@Injectable({
  providedIn: 'any'
})
export class AngularFirePerformance {

  private readonly performance: Observable<FirebasePerformance>;

  constructor(
    app: FirebaseApp,
    @Optional() @Inject(INSTRUMENTATION_ENABLED) instrumentationEnabled: boolean | null,
    @Optional() @Inject(DATA_COLLECTION_ENABLED) dataCollectionEnabled: boolean | null,
    private zone: NgZone,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object
  ) {

    this.performance = of(undefined).pipe(
      switchMap(() => isPlatformBrowser(platformId) ? zone.runOutsideAngular(() => import('firebase/performance')) : EMPTY),
      map(() => ɵfetchInstance(`performance`, 'AngularFirePerformance', app.name, () => {
        const performance = zone.runOutsideAngular(() => {
          return initializePerformance(app, {
            instrumentationEnabled,
            dataCollectionEnabled
          });
        });
        return performance;
      }, [instrumentationEnabled, dataCollectionEnabled])),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return ɵlazySDKProxy(this, this.performance, zone);

  }

}

const trace$ = (traceId: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    const entries = window.performance.getEntriesByName(traceId, 'measure') || [];
    const startMarkName = `_${traceId}Start[${entries.length}]`;
    const endMarkName = `_${traceId}End[${entries.length}]`;
    return new Observable<void>(emitter => {
      window.performance.mark(startMarkName);
      emitter.next();
      return {
        unsubscribe: () => {
          window.performance.mark(endMarkName);
          window.performance.measure(traceId, startMarkName, endMarkName);
        }
      };
    });
  } else {
    return EMPTY;
  }
};

export const traceUntil = <T = any>(
  name: string,
  test: (a: T) => boolean,
  options?: { orComplete?: boolean }
) => (source$: Observable<T>) => new Observable<T>(subscriber => {
  const traceSubscription = trace$(name).subscribe();
  return source$.pipe(
    tap(
      a => test(a) && traceSubscription.unsubscribe(),
      () => {
      },
      () => options && options.orComplete && traceSubscription.unsubscribe()
    )
  ).subscribe(subscriber);
});

export const traceWhile = <T = any>(
  name: string,
  test: (a: T) => boolean,
  options?: { orComplete?: boolean }
) => (source$: Observable<T>) => new Observable<T>(subscriber => {
  let traceSubscription: Subscription | undefined;
  return source$.pipe(
    tap(
      a => {
        if (test(a)) {
          traceSubscription = traceSubscription || trace$(name).subscribe();
        } else {
          if (traceSubscription) {
            traceSubscription.unsubscribe();
          }

          traceSubscription = undefined;
        }
      },
      () => {
      },
      () => options && options.orComplete && traceSubscription && traceSubscription.unsubscribe()
    )
  ).subscribe(subscriber);
});

export const traceUntilComplete = <T = any>(name: string) => (source$: Observable<T>) => new Observable<T>(subscriber => {
  const traceSubscription = trace$(name).subscribe();
  return source$.pipe(
    tap(
      () => {
      },
      () => {
      },
      () => traceSubscription.unsubscribe()
    )
  ).subscribe(subscriber);
});

export const traceUntilFirst = <T = any>(name: string) => (source$: Observable<T>) => new Observable<T>(subscriber => {
  const traceSubscription = trace$(name).subscribe();
  return source$.pipe(
    tap(
      () => traceSubscription.unsubscribe(),
      () => {
      },
      () => {
      }
    )
  ).subscribe(subscriber);
});

export const trace = <T = any>(name: string) => (source$: Observable<T>) => new Observable<T>(subscriber => {
  const traceSubscription = trace$(name).subscribe();
  return source$.pipe(
    tap(
      () => traceSubscription.unsubscribe(),
      () => {
      },
      () => traceSubscription.unsubscribe()
    )
  ).subscribe(subscriber);
});

ɵapplyMixins(AngularFirePerformance, [proxyPolyfillCompat]);
