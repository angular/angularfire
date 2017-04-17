import * as firebase from 'firebase/app';
import 'firebase/database';
import { FirebaseAppConfigToken, FirebaseAppConfig, FirebaseApp } from '../angularfire2';
import { FirebaseListFactory } from './index';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, PathReference, UnwrapSnapshotSignature } from './interfaces';
import { getRef } from './utils';
import { FirebaseListObservable, FirebaseObjectObservable, FirebaseObjectFactory } from './index';

export class AngularFireDatabase {

  constructor(public app: FirebaseApp, private _unwrapSnapshot: UnwrapSnapshotSignature) {}

  list(pathOrRef: PathReference, opts:FirebaseListFactoryOpts = {}):FirebaseListObservable<any[]> {
    const optsWithDefaults = Object.assign({ unwrapSnapshot: this._unwrapSnapshot }, opts);
    return FirebaseListFactory(getRef(this.app, pathOrRef), optsWithDefaults);
  }

  object(pathOrRef: PathReference, opts:FirebaseObjectFactoryOpts = {}):FirebaseObjectObservable<any> {
    const optsWithDefaults = Object.assign({ unwrapSnapshot: this._unwrapSnapshot }, opts);
    return FirebaseObjectFactory(getRef(this.app, pathOrRef), optsWithDefaults);
  }
}
