import { FirebaseFunctions, HttpsCallableResult } from '@firebase/functions-types';
import { FirebaseOptions } from '@firebase/app-types';
import { Injectable, Inject, Optional, NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { FirebaseAppConfig, FirebaseAppName, _firebaseAppFactory, FirebaseZoneScheduler } from 'angularfire2';

import 'rxjs/add/observable/fromPromise';

@Injectable()
export class AngularFireFunctions {

  /**
   * Firebase Functions instance
   */
  public readonly functions: FirebaseFunctions;

  public readonly scheduler: FirebaseZoneScheduler;

  public call(name: string, data?: any) {
    return this.scheduler.keepUnstableUntilFirst(
      this.scheduler.runOutsideAngular(
        Observable.fromPromise(
          this.functions.httpsCallable(name)(data)
        )
      )
    )
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
