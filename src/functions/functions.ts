import { Inject, Injectable, InjectionToken, NgZone, Optional } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, observeOn, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵlazySDKProxy,
  ɵPromiseProxy
} from '@angular/fire';
import { functions } from 'firebase/app';

export const ORIGIN = new InjectionToken<string>('angularfire2.functions.origin');
export const REGION = new InjectionToken<string>('angularfire2.functions.region');

// override httpsCallable for compatibility with 5.x
export interface AngularFireFunctions extends Omit<ɵPromiseProxy<functions.Functions>, 'httpsCallable'> {
}

@Injectable({
  providedIn: 'any'
})
export class AngularFireFunctions {

  public readonly httpsCallable: <T = any, R = any>(name: string) => (data: T) => Observable<R>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string | FirebaseAppConfig | null | undefined,
    zone: NgZone,
    @Optional() @Inject(REGION) region: string | null,
    @Optional() @Inject(ORIGIN) origin: string | null
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);

    const functions = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => import('firebase/functions')),
      tap((it: any) => it),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.functions(region || undefined)),
      tap(functions => {
        if (origin) {
          functions.useFunctionsEmulator(origin);
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.httpsCallable = <T = any, R = any>(name: string) =>
      (data: T) => from(functions).pipe(
        observeOn(schedulers.outsideAngular),
        switchMap(functions => functions.httpsCallable(name)(data)),
        map(r => r.data as R)
      );

    return ɵlazySDKProxy(this, functions, zone);

  }

}
