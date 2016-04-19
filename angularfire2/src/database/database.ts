import {Inject, Injectable} from 'angular2/core';
import {FirebaseUrl} from '../tokens';
import {FirebaseListObservable} from '../utils/firebase_list_observable';
import {FirebaseObjectObservable} from '../utils/firebase_object_observable';
import {FirebaseListFactory, FirebaseListFactoryOpts} from '../utils/firebase_list_factory';
import {FirebaseObjectFactoryOpts, FirebaseObjectFactory} from '../utils/firebase_object_factory';
import * as utils from '../utils/utils'

@Injectable()
export class FirebaseDatabase {
  constructor(@Inject(FirebaseUrl) private fbUrl:string) {}
  list (urlOrRef:string | Firebase | FirebaseQuery, opts?:FirebaseListFactoryOpts):FirebaseListObservable<any[]> {
    return utils.checkForUrlOrFirebaseRef(urlOrRef, {
      isUrl: () => FirebaseListFactory(getAbsUrl(this.fbUrl, <string>urlOrRef), opts),
      isRef: () => FirebaseListFactory(<Firebase>urlOrRef)
    });
  }
  object(urlOrRef: string | Firebase | FirebaseQuery, opts?:FirebaseObjectFactoryOpts):FirebaseObjectObservable<any> {
    return utils.checkForUrlOrFirebaseRef(urlOrRef, {
      isUrl: () => FirebaseObjectFactory(getAbsUrl(this.fbUrl, <string>urlOrRef), opts),
      isRef: () => FirebaseObjectFactory(urlOrRef)
    });
  }
}

function getAbsUrl (root:string, url:string) {
  if (!(/^[a-z]+:\/\/.*/.test(url))) {
    // Provided url is relative.
    url = root + url;
  }
  return url;
}