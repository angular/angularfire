import { Observable } from 'rxjs/Observable';
import { Operator } from 'rxjs/Operator';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';
import { UploadTaskSnapshot } from '../interfaces';
import * as firebase from 'firebase/app';
import 'firebase/storage';

export class FirebaseUploadTaskObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void, public uploadTask?:firebase.storage.UploadTask) {
    super(subscribe);
  }
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirebaseUploadTaskObservable<R>();
    observable.source = this;
    observable.operator = operator;
    observable.uploadTask = this.uploadTask;
    return observable;
  }
  cancel(): boolean {
    if(!this.uploadTask) {
      throw new Error('No uploadTask specified for this Observable!');
    }
    return this.uploadTask.cancel();
  }
  pause(): boolean {
    if(!this.uploadTask) {
      throw new Error('No uploadTask specified for this Observable!');
    }
    return this.uploadTask.pause();
  }
  resume(): boolean {
    if(!this.uploadTask) {
      throw new Error('No uploadTask specified for this Observable!');
    }
    return this.uploadTask.resume();
  }
}
