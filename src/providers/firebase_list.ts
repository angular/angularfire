import {Provider} from 'angular2/core';
import {FirebaseUrl} from '../angularfire';
import {Observer} from 'rxjs/Observer';
import {FirebaseObservable} from '../utils/firebase_observable';
import {absolutePathResolver} from '../utils/absolute_path_resolver';
import {FirebaseListFactory} from '../utils/firebase_list_factory';

export interface FirebaseListConfig {
  token?:any;
  path?: string;
}

export function FirebaseList (config?:FirebaseListConfig|string):Provider {
  var normalConfig = normalizeConfig(config);
  return new Provider(normalConfig.token, {
    useFactory: (defaultFirebase:string) => FirebaseListFactory(absolutePathResolver(defaultFirebase, normalConfig.path)),
    deps: [FirebaseUrl]
  })
}

export function normalizeConfig(config?:FirebaseListConfig|string):FirebaseListConfig {
  switch (typeof config) {
    case 'string':
      // If string, it's just the path of the collection.
      // The path automatically becomes the injectable token
      let strConf:string = <string>config;
      return {
        token: strConf,
        path: strConf
      };
    case 'object':
      let conf:FirebaseListConfig = config;
      let token:any;
      if (conf.token) {
        token = conf.token;
      } else if (conf.path) {
        token = conf.path;
      } else {
        token = FirebaseList;
      }
      return {
        token: token,
        path: conf.path
      };
    default:
      // Presumably no config info provided, default to root
      return {
        token: FirebaseList,
        path: ''
      }
  }
}