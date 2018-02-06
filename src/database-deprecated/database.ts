import { FirebaseDatabase } from '@firebase/database-types';
import { Inject, Injectable, Optional } from '@angular/core';
import { FirebaseApp } from '@firebase/app-types';
import { FirebaseListFactory } from './firebase_list_factory';
import { FirebaseListObservable } from './firebase_list_observable';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, PathReference } from './interfaces';
import { FirebaseObjectFactory } from './firebase_object_factory';
import { FirebaseObjectObservable } from './firebase_object_observable';
import * as utils from './utils';
import { FirebaseOptions } from '@firebase/app-types';
import { FirebaseAppConfig, FirebaseAppName, RealtimeDatabaseURL, _firebaseAppFactory } from 'angularfire2';

@Injectable()
export class AngularFireDatabase {

  /**
   * Firebase Database instance
   */
  database: FirebaseDatabase;

  constructor(
    @Inject(FirebaseAppConfig) config:FirebaseOptions,
    @Optional() @Inject(FirebaseAppName) name:string,
    @Optional() @Inject(RealtimeDatabaseURL) databaseURL:string
  ) {
    const app = _firebaseAppFactory(config, name);
    this.database = app.database!(databaseURL || undefined);
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
