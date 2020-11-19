import { Inject, Injectable, InjectionToken, NgZone, Optional } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, observeOn, shareReplay, switchMap } from 'rxjs/operators';
import {
  FIREBASE_APP_NAME,
  FIREBASE_OPTIONS,
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵfirebaseAppFactory,
  ɵlazySDKProxy,
  ɵPromiseProxy,
  ɵapplyMixins
} from '@angular/fire';
import firebase from 'firebase/app';
import { proxyPolyfillCompat } from './base';
import { HttpsCallableOptions } from '@firebase/functions-types';
import { ɵfetchInstance } from '@angular/fire';

export const ORIGIN = new InjectionToken<string>('angularfire2.functions.origin');
export const REGION = new InjectionToken<string>('angularfire2.functions.region');
export const NEW_ORIGIN_BEHAVIOR = new InjectionToken<boolean>('angularfire2.functions.new-origin-behavior');

// SEMVER(7): use Parameters to detirmine the useEmulator arguments
// type UseEmulatorArguments = Parameters<typeof firebase.functions.Functions.prototype.useEmulator>;
type UseEmulatorArguments = [string, number];
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.functions.use-emulator');

// override httpsCallable for compatibility with 5.x
export interface AngularFireFunctions extends Omit<ɵPromiseProxy<firebase.functions.Functions>, 'httpsCallable'> {
}

@Injectable({
  providedIn: 'any'
})
export class AngularFireFunctions {

  public readonly httpsCallable: <T = any, R = any>(name: string, options?: HttpsCallableOptions) => (data: T) => Observable<R>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string | FirebaseAppConfig | null | undefined,
    zone: NgZone,
    @Optional() @Inject(REGION) region: string | null,
    @Optional() @Inject(ORIGIN) origin: string | null,
    @Optional() @Inject(NEW_ORIGIN_BEHAVIOR) newOriginBehavior: boolean | null,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any, // can't use the tuple here
  ) {
    const schedulers = new ɵAngularFireSchedulers(zone);
    const useEmulator: UseEmulatorArguments | null = _useEmulator;

    const functions = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => import('firebase/functions')),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      map(app => ɵfetchInstance(`${app.name}.functions.${region || origin}`, 'AngularFireFunctions', app, () => {
        let functions: firebase.functions.Functions;
        if (newOriginBehavior) {
          if (region && origin) {
            throw new Error('REGION and ORIGIN can\'t be used at the same time.');
          }
          functions = app.functions(region || origin || undefined);
        } else {
          functions = app.functions(region || undefined);
        }
        if (!newOriginBehavior && !useEmulator && origin) {
          functions.useFunctionsEmulator(origin);
        }
        if (useEmulator) {
          functions.useEmulator(...useEmulator);
        }
        return functions;
      }, [region, origin, useEmulator])),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.httpsCallable = <T = any, R = any>(name: string, options?: HttpsCallableOptions) =>
      (data: T) => from(functions).pipe(
        observeOn(schedulers.insideAngular),
        switchMap(functions => functions.httpsCallable(name, options)(data)),
        map(r => r.data as R)
      );

    return ɵlazySDKProxy(this, functions, zone);

  }

}

ɵapplyMixins(AngularFireFunctions, [proxyPolyfillCompat]);
