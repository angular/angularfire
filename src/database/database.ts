import * as firebase from 'firebase/app';
import 'firebase/database';
import { Inject, Injectable } from '@angular/core';
import { FirebaseAppConfigToken, FirebaseAppConfig, FirebaseApp } from '../angularfire2';
import { FirebaseListFactory } from './index';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts, PathReference } from '../interfaces';
import * as utils from '../utils';
import { FirebaseListObservable, FirebaseObjectObservable, FirebaseObjectFactory } from './index';

@Injectable()
export class AngularFireDatabase {
  
  constructor(private app: FirebaseApp) {}
  
  list(pathOrRef: PathReference, opts?:FirebaseListFactoryOpts):FirebaseListObservable<any[]> {
    const ref = utils.getRef(this.app, pathOrRef);
    return FirebaseListFactory(utils.getRef(this.app, ref), opts);
  }

  object(pathOrRef: PathReference, opts?:FirebaseObjectFactoryOpts):FirebaseObjectObservable<any> {
    return utils.checkForUrlOrFirebaseRef(pathOrRef, {
      isUrl: () => FirebaseObjectFactory(this.app.database().ref(<string>pathOrRef), opts),
      isRef: () => FirebaseObjectFactory(pathOrRef)
    });
  }

}

