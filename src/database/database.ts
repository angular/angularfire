import {Inject, Injectable} from '@angular/core';
import {FirebaseConfig} from '../tokens';
import {FirebaseAppConfig} from '../angularfire2';
import {FirebaseListObservable} from '../utils/firebase_list_observable';
import {FirebaseObjectObservable} from '../utils/firebase_object_observable';
import {FirebaseListFactory, FirebaseListFactoryOpts} from '../utils/firebase_list_factory';
import {FirebaseObjectFactoryOpts, FirebaseObjectFactory} from '../utils/firebase_object_factory';
import * as utils from '../utils/utils'

@Injectable()
export class FirebaseDatabase {
  constructor(@Inject(FirebaseConfig) private fbConfig:FirebaseAppConfig) {}
  list (urlOrRef:string | firebase.database.Reference, opts?:FirebaseListFactoryOpts):FirebaseListObservable<any[]> {
    return utils.checkForUrlOrFirebaseRef(urlOrRef, {
      isUrl: () => FirebaseListFactory(getAbsUrl(this.fbConfig, <string>urlOrRef), opts),
      isRef: () => FirebaseListFactory(<firebase.database.Reference>urlOrRef)
    });
  }
  object(urlOrRef: string | firebase.database.Reference, opts?:FirebaseObjectFactoryOpts):FirebaseObjectObservable<any> {
    return utils.checkForUrlOrFirebaseRef(urlOrRef, {
      isUrl: () => FirebaseObjectFactory(getAbsUrl(this.fbConfig, <string>urlOrRef), opts),
      isRef: () => FirebaseObjectFactory(urlOrRef)
    });
  }
}

function getAbsUrl (root:FirebaseAppConfig, url:string) {
  if (!(/^[a-z]+:\/\/.*/.test(url))) {
    // Provided url is relative.
    // Strip any leading slash
    url = root.databaseURL + '/' + utils.stripLeadingSlash(url);
  }
  return url;
}
