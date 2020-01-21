import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, observeOn } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig, FIREBASE_APP_NAME } from '@angular/fire';
import { FirebaseFunctions, FIREBASE_OPTIONS, _firebaseAppFactory, ɵAngularFireSchedulers } from '@angular/fire';

// SEMVER: @ v6 remove FunctionsRegionToken and FUNCTIONS_REGION in favor of REGION
export const FunctionsRegionToken = new InjectionToken<string>('angularfire2.functions.region');
export const FUNCTIONS_REGION = FunctionsRegionToken;
// SEMVER: @ v6 remove FUNCTIONS_ORIGIN in favor of ORIGIN
export const FUNCTIONS_ORIGIN = new InjectionToken<string>('angularfire2.functions.origin');

export const ORIGIN = FUNCTIONS_ORIGIN;
export const REGION = FunctionsRegionToken;

@Injectable()
export class AngularFireFunctions {

  /**
   * Firebase Functions instance
   */
  public readonly functions: FirebaseFunctions;

  public readonly schedulers: ɵAngularFireSchedulers;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(REGION) region:string|null,
    @Optional() @Inject(ORIGIN) origin:string|null
  ) {
    this.schedulers = new ɵAngularFireSchedulers(zone);

    this.functions = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, zone, nameOrConfig);
      return app.functions(region || undefined);
    });

    if (origin) {
      this.functions.useFunctionsEmulator(origin);
    }

  }

  public httpsCallable<T=any, R=any>(name: string) {
    const callable = this.functions.httpsCallable(name);
    return (data: T) => {
      const callable$ = from(callable(data));
      return callable$.pipe(
        observeOn(this.schedulers.outsideAngular),
        map(r => r.data as R)
      );
    }
  }

}
