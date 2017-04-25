import * as firebase from 'firebase/app';
import 'firebase/database';
import { Inject, Injectable } from '@angular/core';
import { FirebaseAppConfigToken, FirebaseAppConfig, FirebaseApp } from '../angularfire2';
import { FirebaseListFactory } from './firebase_list_factory';
import { FirebaseListObservable } from './firebase_list_observable';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, PathReference } from '../interfaces';
import { FirebaseObjectFactory } from './firebase_object_factory';
import { FirebaseObjectObservable } from './firebase_object_observable';
import * as utils from '../utils';

@Injectable()
export class AngularFireDatabase {

  /**
   * Firebase Database instance
   */
  Database: firebase.database.Database;

  constructor(public app: FirebaseApp) {
    this.Database = app.database();
  }

  list(pathOrRef: PathReference, opts?:FirebaseListFactoryOpts):FirebaseListObservable<any[]> {
    const ref = utils.getRef(this.app, pathOrRef);
    return FirebaseListFactory(ref, opts);
  }

  object(pathOrRef: PathReference, opts?:FirebaseObjectFactoryOpts):FirebaseObjectObservable<any> {
    const ref = utils.getRef(this.app, pathOrRef);
    return FirebaseObjectFactory(ref, opts);
  }

}
