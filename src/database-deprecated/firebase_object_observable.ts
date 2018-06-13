import { Observable, Operator, Subscriber, Subscription } from 'rxjs';
import { Reference } from './interfaces';
import { database } from 'firebase';

export class FirebaseObjectObservable<T> extends Observable<T> {
  constructor(subscribe?: <R>(subscriber: Subscriber<R>) => Subscription | Function | void, public $ref?:Reference) {
    super(subscribe);
  }
  lift<T, R>(operator: Operator<T, R>): Observable<R> {
    const observable = new FirebaseObjectObservable<R>();
    observable.source = this;
    observable.operator = operator;
    observable.$ref = this.$ref;
    return observable;
  }
  set(value: any): Promise<void> {
    if(!this.$ref) {
      throw new Error('No ref specified for this Observable!');
    }
    return this.$ref.set(value);
  }
  update(value: Object): Promise<void> {
    if(!this.$ref) {
      throw new Error('No ref specified for this Observable!');
    }
    return this.$ref.update(value);
  }
  remove(): Promise<void> {
    if(!this.$ref) {
      throw new Error('No ref specified for this Observable!');
    }
    return this.$ref.remove();
  }
}
