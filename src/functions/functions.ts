import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig } from '@angular/fire';
import { FirebaseFunctions, FirebaseOptionsToken, FirebaseNameOrConfigToken, _firebaseAppFactory, FirebaseZoneScheduler } from '@angular/fire';

export const FunctionsRegionToken = new InjectionToken<string>('angularfire2.functions.region');
export const FunctionsEmulatorOriginToken = new InjectionToken<string>('angularfire2.functions.emulatorOrigin');

@Injectable()
export class AngularFireFunctions {

  /**
   * Firebase Functions instance
   */
  public readonly functions: FirebaseFunctions;

  public readonly scheduler: FirebaseZoneScheduler;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseNameOrConfigToken) nameOrConfig:string|FirebaseAppConfig|null,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(FunctionsRegionToken) region:string|null,
    @Optional() @Inject(FunctionsEmulatorOriginToken) emulatorOrigin:string|null
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone, platformId);
    
    this.functions = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, nameOrConfig);
      return app.functions(region || undefined);
    });

    if (emulatorOrigin) {
      this.functions.useFunctionsEmulator(emulatorOrigin);
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
