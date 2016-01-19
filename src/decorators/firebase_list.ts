declare var Reflect:any;
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import * as Firebase from 'firebase';

class FirebaseListDecorator {
  path:string;
  constructor({path}:{path:string}) {
    this.path = path;
  }
}

/**
 * This is copied from makePropDecorator in Angular.
 */
export function FirebaseList(...args:any[]): any {
  var decoratorInstance = Object.create(FirebaseListDecorator.prototype);
  FirebaseListDecorator.apply(decoratorInstance, args);

  return function PropDecorator(target: any, name: string) {
    var meta = Reflect.getOwnMetadata('propMetadata', target.constructor);
    target[name] = Observable.create((obs:Observer<any[]>) => {
      var arr:any[] = [];
      target[name].firebaseRef = new Firebase(decoratorInstance.path);
      target[name].firebaseRef.on('child_added', (child:any) => {
        arr.push(child);
        obs.next(arr);
      });
      target[name].firebaseRef.on('child_moved', (child:any, prevKey:any) => {
        arr = arr.reduce((accumulator:any[], val:any, i:number) => {
          if (!prevKey && i==0) {
            accumulator.push(child);
          } else if(val.key() === prevKey) {
            accumulator.push(val);
            accumulator.push(child);
          } else if (val.key() !== child.key()) {
            accumulator.push(val);
          }
          return accumulator;
        }, []);
        obs.next(arr);
      });
    });
    meta = meta || {};
    meta[name] = meta[name] || [];
    meta[name].unshift(decoratorInstance);
    Reflect.defineMetadata('propMetadata', meta, target.constructor);
  };
}
