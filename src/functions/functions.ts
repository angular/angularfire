import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig, FIREBASE_APP_NAME } from '@angular/fire';
import { FirebaseFunctions, FIREBASE_OPTIONS, _firebaseAppFactory, FirebaseZoneScheduler } from '@angular/fire';

// SEMVER: @ v6 remove FunctionsRegionToken in favor of FUNCTIONS_REGION
export const FunctionsRegionToken = new InjectionToken<string>('angularfire2.functions.region');
export const FUNCTIONS_ORIGIN = new InjectionToken<string>('angularfire2.functions.origin');
export const FUNCTIONS_REGION = FunctionsRegionToken;

@Injectable()
export class AngularFireFunctions {

  /**
   * Firebase Functions instance
   */
  public readonly functions: FirebaseFunctions;

  public readonly scheduler: FirebaseZoneScheduler;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(FUNCTIONS_REGION) region:string|null,
    @Optional() @Inject(FUNCTIONS_ORIGIN) origin:string|null
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone, platformId);
    
    this.functions = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, nameOrConfig);
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
      return this.scheduler.runOutsideAngular(
        callable$.pipe(
          map(r => r.data as R)
        )
      )
    }
  }

}
