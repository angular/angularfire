import * as firebase from 'firebase/app';
import 'firebase/database';
import { Inject, Injectable } from '@angular/core';
import { FirebaseAppConfigToken, FirebaseAppConfig, FirebaseApp } from '../angularfire2';
import { FirebaseListFactory } from './index';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, PathReference } from './interfaces';
import { checkForUrlOrFirebaseRef, getRef } from './utils';
import { FirebaseListObservable, FirebaseObjectObservable, FirebaseObjectFactory } from './index';

@Injectable()
export class AngularFireDatabase {

  constructor(public app: FirebaseApp) {}

  list(pathOrRef: PathReference, opts?:FirebaseListFactoryOpts):FirebaseListObservable<any[]> {
    const ref = getRef(this.app, pathOrRef);
    return FirebaseListFactory(getRef(this.app, ref), opts);
  }

  object(pathOrRef: PathReference, opts?:FirebaseObjectFactoryOpts):FirebaseObjectObservable<any> {
    return checkForUrlOrFirebaseRef(pathOrRef, {
      isUrl: () => FirebaseObjectFactory(this.app.database().ref(<string>pathOrRef), opts),
      isRef: () => FirebaseObjectFactory(pathOrRef)
    });
  }

}
