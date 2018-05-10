import { FirebaseDatabase } from '@firebase/database-types';
import { Inject, Injectable, Optional, NgZone } from '@angular/core';
import { FirebaseListFactory } from './firebase_list_factory';
import { FirebaseListObservable } from './firebase_list_observable';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, PathReference } from './interfaces';
import { FirebaseObjectFactory } from './firebase_object_factory';
import { FirebaseObjectObservable } from './firebase_object_observable';
import * as utils from './utils';
import { FirebaseOptions, FirebaseAppConfig } from '@firebase/app-types';
import { FirebaseOptionsToken, AppNameToken, DatabaseURLToken, FirebaseAppConfigToken, _firebaseAppFactory } from 'angularfire2';

@Injectable()
export class AngularFireDatabase {

  /**
   * Firebase Database instance
   */
  database: FirebaseDatabase;

  constructor(
    @Inject(FirebaseOptionsToken) options:FirebaseOptions,
    @Optional() @Inject(FirebaseAppConfigToken) config:FirebaseAppConfig,
    @Optional() @Inject(AppNameToken) name:string,
    @Optional() @Inject(DatabaseURLToken) databaseURL:string,
    zone: NgZone
  ) {
    this.database = zone.runOutsideAngular(() => {
      const app = _firebaseAppFactory(options, name, config);
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

export { DatabaseURLToken };