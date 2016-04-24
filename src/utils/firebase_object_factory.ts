import {FirebaseObjectObservable} from './firebase_object_observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/mergeMap';
import * as Firebase from 'firebase';
import * as utils from './utils';
import {Query, observeQuery} from './query_observable';

export function FirebaseObjectFactory(absoluteUrlOrDbRef: string | Firebase, {preserveSnapshot, query}: FirebaseObjectFactoryOpts = {}): FirebaseObjectObservable<any> {
  let ref: Firebase;

  utils.checkForUrlOrFirebaseRef(absoluteUrlOrDbRef, {
    isUrl: () => ref = new Firebase(<string>absoluteUrlOrDbRef),
    isRef: () => ref = <Firebase>absoluteUrlOrDbRef
  });
  
  // const queryObs = observeQuery(query);
  
  // queryObs
  //   .map(qo => {
  //     return ref;
  //   })
  //   .mergeMap((queryRef: Firebase, ix: number) => {
  //     console.log('mergeMap', queryRef);
  //     return new FirebaseObjectObservable((obs: Observer<any[]>) => {
  //       queryRef.on('value', (snapshot) => {
  //         obs.next(preserveSnapshot ? snapshot : snapshot.val())
  //       });

  //       return () => queryRef.off();
  //     }, queryRef); 
  //   })
  //   .do(a => console.log('do', a))
  //   .subscribe(qo => {
  //     console.log('subscribe', qo);
  //   });

  return new FirebaseObjectObservable((obs: Observer<any[]>) => {
    ref.on('value', (snapshot) => {
      obs.next(preserveSnapshot ? snapshot : snapshot.val())
    });

    return () => ref.off();
  }, ref);
}

export interface FirebaseObjectFactoryOpts {
  preserveSnapshot?: boolean;
  query?: Query
}
