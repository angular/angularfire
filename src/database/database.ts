import { Inject, Injectable } from '@angular/core';
import { FirebaseConfig } from '../tokens';
import { FirebaseAppConfig } from '../angularfire2';
import { FirebaseListFactory } from './index';
import { FirebaseListFactoryOpts, FirebaseObjectFactoryOpts } from '../interfaces';
import * as utils from '../utils/utils';
import { 
  FirebaseListObservable,
  FirebaseObjectObservable,
  FirebaseObjectFactory
} from './index';

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
