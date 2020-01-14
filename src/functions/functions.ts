import { Injectable, Inject, Optional, NgZone, PLATFORM_ID, InjectionToken } from '@angular/core';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirebaseOptions, FirebaseAppConfig, FIREBASE_APP_NAME } from '@angular/fire';
import { FirebaseFunctions, FIREBASE_OPTIONS, ɵfirebaseAppFactory, ɵFirebaseZoneScheduler } from '@angular/fire';

export const ORIGIN = new InjectionToken<string>('angularfire2.functions.origin');
export const REGION = new InjectionToken<string>('angularfire2.functions.region');

@Injectable()
export class AngularFireFunctions {

  /**
   * Firebase Functions instance
   */
  public readonly functions: FirebaseFunctions;

  public readonly scheduler: ɵFirebaseZoneScheduler;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone,
    @Optional() @Inject(REGION) region:string|null,
    @Optional() @Inject(ORIGIN) origin:string|null
  ) {
    this.scheduler = new ɵFirebaseZoneScheduler(zone, platformId);
    
    this.functions = zone.runOutsideAngular(() => {
      const app = ɵfirebaseAppFactory(options, zone, nameOrConfig);
      if (!app.functions) { throw "You must import 'firebase/functions' before using AngularFireFunctions" }
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
