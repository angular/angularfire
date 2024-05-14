import { Inject, Injectable, InjectionToken, NgZone, Optional } from '@angular/core';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { AppCheckInstances } from '@angular/fire/app-check';
import { ɵPromiseProxy, ɵapplyMixins, ɵlazySDKProxy } from '@angular/fire/compat';
import { FIREBASE_APP_NAME, FIREBASE_OPTIONS, ɵcacheInstance, ɵfirebaseAppFactory } from '@angular/fire/compat';
import { HttpsCallableOptions } from '@firebase/functions-types';
import { FirebaseOptions } from 'firebase/app';
import firebase from 'firebase/compat/app';
import { Observable, from, of } from 'rxjs';
import { map, observeOn, shareReplay, switchMap } from 'rxjs/operators';
import { proxyPolyfillCompat } from './base';

export const ORIGIN = new InjectionToken<string>('angularfire2.functions.origin');
export const REGION = new InjectionToken<string>('angularfire2.functions.region');

type UseEmulatorArguments = Parameters<firebase.functions.Functions['useEmulator']>;
export const USE_EMULATOR = new InjectionToken<UseEmulatorArguments>('angularfire2.functions.use-emulator');

// override httpsCallable for compatibility with 5.x
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AngularFireFunctions extends Omit<ɵPromiseProxy<firebase.functions.Functions>, 'httpsCallable'> {
}

@Injectable({
  providedIn: 'any'
})
export class AngularFireFunctions {

  public readonly httpsCallable: <T = any, R = any>(name: string, options?: HttpsCallableOptions) => (data: T) => Observable<R>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | null | undefined,
    zone: NgZone,
    schedulers: ɵAngularFireSchedulers,
    @Optional() @Inject(REGION) region: string | null,
    @Optional() @Inject(ORIGIN) origin: string | null,
    @Optional() @Inject(USE_EMULATOR) _useEmulator: any, // can't use the tuple here
    @Optional() _appCheckInstances: AppCheckInstances,
  ) {
    const useEmulator: UseEmulatorArguments | null = _useEmulator;

    const functions = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => import('firebase/compat/functions')),
      map(() => ɵfirebaseAppFactory(options, zone, name)),
      map(app => ɵcacheInstance(`${app.name}.functions.${region || origin}`, 'AngularFireFunctions', app.name, () => {
        let functions: firebase.functions.Functions;
        if (region && origin) {
          throw new Error('REGION and ORIGIN can\'t be used at the same time.');
        }
        functions = app.functions(region || origin || undefined);
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
