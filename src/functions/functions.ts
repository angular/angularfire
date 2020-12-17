import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, observeOn, shareReplay, switchMap, withLatestFrom } from 'rxjs/operators';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵlazySDKProxy,
  ɵPromiseProxy,
  ɵapplyMixins
} from '@angular/fire';
import { proxyPolyfillCompat } from './base';
import { HttpsCallableOptions } from '@firebase/functions-types';
import { ɵfetchInstance } from '@angular/fire';
import { Functions } from '@firebase/functions-types';
import { FirebaseOptions } from '@firebase/app-types';

export const ORIGIN = new InjectionToken<string>('angularfire2.functions.origin');
export const REGION = new InjectionToken<string>('angularfire2.functions.region');

// SEMVER(7): use Parameters to detirmine the useEmulator arguments
// type UseEmulatorArguments = Parameters<typeof firebase.functions.Functions.prototype.useEmulator>;
type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.functions.use-emulator');

// override httpsCallable for compatibility with 5.x
export interface AngularFireFunctions extends Omit<ɵPromiseProxy<Functions>, 'httpsCallable'> {
}

@Injectable({
  providedIn: 'any'
})
export class AngularFireFunctions {

  public readonly httpsCallable: <T = any, R = any>(name: string, options?: HttpsCallableOptions) => (data: T) => Observable<R>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | undefined,
    zone: NgZone,
    @Optional() @Inject(REGION) region: string | null,
    @Optional() @Inject(ORIGIN) origin: string | null,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any, // can't use the tuple here
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);
    const useEmulator: UseEmulatorArguments | null = _useEmulator;

    const functions = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => import(/* webpackExports: ["getFunctions", "useFunctionsEmulator"] */ 'firebase/functions')),
      map(({ getFunctions, useFunctionsEmulator }) => {
        const app = ɵfirebaseAppFactory(options, zone, platformId, name, undefined);
        return ɵfetchInstance(`${app.name}.functions.${region || origin}`, 'AngularFireFunctions', app, () => {
          if (region && origin) {
            throw new Error('REGION and ORIGIN can\'t be used at the same time.');
          }
          const functions = getFunctions(app, region || origin || undefined);
          if (useEmulator) {
            useFunctionsEmulator(functions, ...useEmulator);
          }
          return functions;
        }, [region, origin, useEmulator]);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    const functionsWithHttpsCallable = () => import(/* webpackExports: ["httpsCallable"] */ 'firebase/functions');
    this.httpsCallable = <T = any, R = any>(name: string, options?: HttpsCallableOptions) =>
      (data: T) => from(functions).pipe(
        withLatestFrom(functionsWithHttpsCallable()),
        observeOn(schedulers.insideAngular),
        switchMap(([functions, { httpsCallable }]) => httpsCallable(functions, name, options)(data)),
        map(r => r.data as R)
      );

    return ɵlazySDKProxy(this, functions, zone);

  }

}

ɵapplyMixins(AngularFireFunctions, [proxyPolyfillCompat]);
