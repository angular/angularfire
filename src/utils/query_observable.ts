import {Observable} from 'rxjs/Observable';
import {ScalarObservable} from 'rxjs/observable/ScalarObservable';
import {Operator} from 'rxjs/Operator';
import {Observer} from 'rxjs/Observer';
import {merge} from 'rxjs/operator/merge';
import {map} from 'rxjs/operator/map';

export interface Query {
  [key:string]: any;
  orderByKey?: boolean | Observable<boolean>;
  orderByPriority?: boolean | Observable<boolean>;
  orderByChild?: string | Observable<string>;
  orderByValue?: boolean | Observable<boolean>;
  equalTo?: any | Observable<any>;
  startAt?: any | Observable<any>;
  endAt?: any | Observable<any>;
}

export enum OrderByOptions {
  Child,
  Key,
  Value,
  Priority
}

export enum QueryOptions {
  EqualTo,
  StartAt,
  EndAt
}

export interface OrderBySelection {
  key: OrderByOptions | QueryOptions;
  value: boolean | string;
}

export interface StartAtSelection {
  key: number | string | boolean;
}

export function observeQuery (query: Query): Observable<Query> {
  console.log('observeQuery', query);
  if (!isPresent(query)) {
    return new ScalarObservable(null);
  }

  // if (!hasObservableProperties(query)) {
  //   return new ScalarObservable(query);
  // }

  return Observable.create((observer: Observer<Query>) => {
    var serializedOrder:Query = {};

    console.log('getOrderObservables', getOrderObservables(query));

    getOrderObservables(query)
      .combineLatest(getStartAtObservable(query))
      .subscribe(([orderBy, startAt]:[OrderBySelection,StartAtSelection]) => {
        console.log('v', orderBy, startAt);
        if (!isPresent(orderBy) || !isPresent(orderBy.value)) {
          serializedOrder = {};
        } else {
          switch (orderBy.key) {
            case OrderByOptions.Key:
              serializedOrder = {orderByKey: <boolean>orderBy.value};
              break;
            case OrderByOptions.Priority:
              serializedOrder = {orderByPriority: <boolean>orderBy.value};
              break;
            case OrderByOptions.Value:
              serializedOrder = {orderByValue: <boolean>orderBy.value};
              break;
            case OrderByOptions.Child:
              serializedOrder = {orderByChild: <string>orderBy.value};
              break;
          }
        }
        console.log('serializedOrder.startAt', startAt);
        serializedOrder.startAt = startAt;

        // TODO: this should combine with other parts of the query
        observer.next(serializedOrder);
      });
  });
}

export function getOrderObservables(query: Query): Observable<OrderBySelection> {
  console.log('query in getOrderObservables', query);
  var observables = ['orderByChild', 'orderByKey', 'orderByValue', 'orderByPriority']
    .map((key:string, option:OrderByOptions) => {
      console.log('mapping', key);
      return ({ key, option })
    })
    .filter(({key, option}:{key: string, option: OrderByOptions}) => {
      return isPresent(query[key]);
    })
    .map(({key, option}) => mapToOrderBySelection(<any>query[key], option));

    if (observables.length === 1) {
      return observables[0];
    } else if (observables.length > 1) {
      return observables[0].merge(observables.slice(1));
    } else {

    }

    return Observable.of(null);
}

export function getStartAtObservable(query: Query): Observable<StartAtSelection> {
  console.log('startAt', query.startAt)
  if (query.startAt instanceof Observable) {
    console.log('instanceof observable');
    return query.startAt;
  } else if (typeof query.startAt !== 'undefined') {
    console.log('observable.of');
    return Observable.of(query.startAt);
  } else {
    console.log('empty');
    return Observable.of(null);
  }
}

function mapToOrderBySelection (value:Observable<boolean|string> | boolean | string, key:OrderByOptions): Observable<OrderBySelection> {
  if (value instanceof Observable) {
    return map
      .call(value, (value: boolean):OrderBySelection => {
        console.log({ value, key});
        return ({ value, key});
      });
  } else {
    console.log('returning scalar', key, value);
    return Observable.of({key, value});
  }

}

function hasObservableProperties(query: Query): boolean {
  if (query.orderByKey instanceof Observable) return true;
  return false;
}

function isPresent(val: any): boolean {
  return val !== undefined && val !== null;
}

