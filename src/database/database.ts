import {Inject} from 'angular2/core';
import {FirebaseUrl} from '../tokens';
import {FirebaseListObservable} from '../utils/firebase_list_observable';
import {FirebaseObjectObservable} from '../utils/firebase_object_observable';
import {FirebaseListFactory, FirebaseListFactoryOpts} from '../utils/firebase_list_factory';
import {FirebaseObjectFactoryOpts, FirebaseObjectFactory} from '../utils/firebase_object_factory';

export class FirebaseDatabase {
  constructor(@Inject(FirebaseUrl) private fbUrl:string) {}
  list (url:string, opts?:FirebaseListFactoryOpts):FirebaseListObservable<any[]> {
    return FirebaseListFactory(getAbsUrl(this.fbUrl, url), opts);
  }
  object(url: string, opts?:FirebaseObjectFactoryOpts):FirebaseObjectObservable<any> {
    return FirebaseObjectFactory(getAbsUrl(this.fbUrl, url), opts);
  }
}

function getAbsUrl (root:string, url:string) {
  if (!(/^[a-z]+:\/\/.*/.test(url))) {
    // Provided url is relative.
    url = root + url;
  }
  return url;
}