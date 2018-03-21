import { FirebaseFunctions, HttpsCallableResult } from '@firebase/functions-types';
import { FirebaseOptions } from '@firebase/app-types';
import { Injectable, Inject, Optional, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { FirebaseAppConfig, FirebaseAppName, _firebaseAppFactory, FirebaseZoneScheduler } from 'angularfire2';

import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/map'

@Injectable()
export class AngularFireFunctions {

  /**
   * Firebase Functions instance
   */
  public readonly functions: FirebaseFunctions;

  public readonly scheduler: FirebaseZoneScheduler;

  public httpsCallable<T, R>(name: string) {
    const callable = this.functions.httpsCallable(name);
    return (data: T) => {
      return this.scheduler.runOutsideAngular(
        Observable.fromPromise(callable(data))
          .map(r => r.data as R)
      )
    }
  }

  constructor(
    @Inject(FirebaseAppConfig) config:FirebaseOptions,
    @Optional() @Inject(FirebaseAppName) name:string,
    private zone: NgZone
  ) {
    this.scheduler = new FirebaseZoneScheduler(zone);
    
    this.functions = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(config, name);
      return app.functions();
    });

  }

}
