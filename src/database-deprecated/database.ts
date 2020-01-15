import { Inject, Injectable, Optional, NgZone } from '@angular/core';
import { FirebaseListFactory } from './firebase_list_factory';
import { FirebaseListObservable } from './firebase_list_observable';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, PathReference } from './interfaces';
import { FirebaseObjectFactory } from './firebase_object_factory';
import { FirebaseObjectObservable } from './firebase_object_observable';
import * as utils from './utils';
import { FirebaseDatabase, FirebaseOptions, FirebaseAppConfig, FIREBASE_OPTIONS, FIREBASE_APP_NAME, DATABASE_URL, ɵfirebaseAppFactory } from '@angular/fire';

@Injectable({
  providedIn: 'root'
})
export class AngularFireDatabase {

  /**
   * Firebase Database instance
   */
  database: FirebaseDatabase;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(DATABASE_URL) databaseURL:string|null,
    zone: NgZone
  ) {
    this.database = zone.runOutsideAngular(() => {
      const app = ɵfirebaseAppFactory(options, zone, nameOrConfig);
      if (!app.database) { throw "You must import 'firebase/database' before using AngularFireDatabase" }
      return app.database(databaseURL || undefined);
    });
  }

  list(pathOrRef: PathReference, opts?:FirebaseListFactoryOpts):FirebaseListObservable<any[]> {
    const ref = utils.getRef(this.database, pathOrRef);
    return FirebaseListFactory(ref, opts);
  }

  object(pathOrRef: PathReference, opts?:FirebaseObjectFactoryOpts):FirebaseObjectObservable<any> {
    const ref = utils.getRef(this.database, pathOrRef);
    return FirebaseObjectFactory(ref, opts);
  }

}

export { DATABASE_URL, DATABASE_URL as URL };