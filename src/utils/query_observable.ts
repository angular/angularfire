import {Observable} from 'rxjs/Observable';
import {ScalarObservable} from 'rxjs/observable/ScalarObservable';
import {Operator} from 'rxjs/Operator';
import {Observer} from 'rxjs/Observer';
import {merge} from 'rxjs/operator/merge';
import {map} from 'rxjs/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/combineLatest';

export interface Query {
  [key: string]: any;
  orderByKey?: boolean | Observable<boolean>;
  orderByPriority?: boolean | Observable<boolean>;
  orderByChild?: string | Observable<string>;
  orderByValue?: boolean | Observable<boolean>;
  equalTo?: any | Observable<any>;
  startAt?: any | Observable<any>;
  endAt?: any | Observable<any>;
  limitToFirst?: number | Observable<number>;
  limitToLast?: number | Observable<number>;
}

export interface ScalarQuery {
  [key: string]: any;
  orderByKey?: boolean;
  orderByPriority?: boolean;
  orderByChild?: string;
  orderByValue?: boolean;
  equalTo?: any;
  startAt?: any;
  endAt?: any;
  limitToFirst?: number;
  limitToLast?: number;
}

export enum OrderByOptions {
  Child,
  Key,
  Value,
  Priority
}

export enum LimitToOptions {
  First,
  Last
}

export enum QueryOptions {
  EqualTo,
  StartAt,
  EndAt
}

export interface OrderBySelection {
  key: OrderByOptions;
  value: boolean | string;
}

export interface LimitToSelection {
  key: LimitToOptions;
  value: number;
}

export type Primitive = number | string | boolean;


export function observeQuery(query: Query): Observable<ScalarQuery> {
  if (!isPresent(query)) {
    return new ScalarObservable(null);
  }

  return Observable.create((observer: Observer<ScalarQuery>) => {
    getOrderObservables(query)
      .combineLatest(
      getStartAtObservable(query),
      getEndAtObservable(query),
      getEqualToObservable(query),
      getLimitToObservables(query)
      )
      .subscribe(([orderBy, startAt, endAt, equalTo, limitTo]
        : [OrderBySelection, Primitive, Primitive, Primitive, LimitToSelection]) => {

        var serializedOrder: any = {};
        if (isPresent(orderBy) && isPresent(orderBy.value)) {
          switch (orderBy.key) {
            case OrderByOptions.Key:
              serializedOrder = { orderByKey: <boolean>orderBy.value };
              break;
            case OrderByOptions.Priority:
              serializedOrder = { orderByPriority: <boolean>orderBy.value };
              break;
            case OrderByOptions.Value:
              serializedOrder = { orderByValue: <boolean>orderBy.value };
              break;
            case OrderByOptions.Child:
              serializedOrder = { orderByChild: <string>orderBy.value };
              break;
          }
        }

        if (isPresent(limitTo) && isPresent(limitTo.value)) {
          switch (limitTo.key) {
            case LimitToOptions.First:
              serializedOrder.limitToFirst = limitTo.value;
              break;
            case LimitToOptions.Last: {
              serializedOrder.limitToLast = limitTo.value;
              break;
            }
          }
        }

        if (isPresent(startAt)) {
          serializedOrder.startAt = startAt;
        }

        if (isPresent(endAt)) {
          serializedOrder.endAt = endAt;
        }

        if (isPresent(equalTo)) {
          serializedOrder.equalTo = equalTo;
        }

        observer.next(serializedOrder);
      });
  });
}

export function getOrderObservables(query: Query): Observable<OrderBySelection> | Observable<OrderBySelection | Observable<OrderBySelection>> {
  var observables = ['orderByChild', 'orderByKey', 'orderByValue', 'orderByPriority']
    .map((key: string, option: OrderByOptions) => {
      return ({ key, option });
    })
    .filter(({key, option}: { key: string, option: OrderByOptions }) => {
      return isPresent(query[key]);
    })
    .map(({key, option}) => mapToOrderBySelection(<any>query[key], option));

  if (observables.length === 1) {
    return observables[0];
  } else if (observables.length > 1) {
    return observables[0].merge(observables.slice(1));
  } else {
    return new Observable<OrderBySelection>(subscriber => {
      subscriber.next(null);
    });
  }
}

export function getLimitToObservables(query: Query): Observable<LimitToSelection> | Observable<LimitToSelection | Observable<LimitToSelection>> {
  var observables = ['limitToFirst', 'limitToLast']
    .map((key: string, option: LimitToOptions) => ({ key, option }))
    .filter(({key, option}: { key: string, option: LimitToOptions }) => isPresent(query[key]))
    .map(({key, option}) => mapToLimitToSelection(<any>query[key], option));

  if (observables.length === 1) {
    return observables[0];
  } else if (observables.length > 1) {
    return observables[0].merge(observables.slice(1));
  } else {
    return new Observable<LimitToSelection>(subscriber => {
      subscriber.next(null);
    });
  }
}

export function getStartAtObservable(query: Query): Observable<Primitive> {
  if (query.startAt instanceof Observable) {
    return query.startAt;
  } else if (typeof query.startAt !== 'undefined') {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(query.startAt);
    });
  } else {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(null);
    });
  }
}

export function getEndAtObservable(query: Query): Observable<Primitive> {
  if (query.endAt instanceof Observable) {
    return query.endAt;
  } else if (typeof query.endAt !== 'undefined') {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(query.endAt);
    });
  } else {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(null);
    });
  }
}

export function getEqualToObservable(query: Query): Observable<Primitive> {
  if (query.equalTo instanceof Observable) {
    return query.equalTo;
  } else if (typeof query.equalTo !== 'undefined') {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(query.equalTo);
    });
  } else {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(null);
    });
  }
}


function mapToOrderBySelection(value: Observable<boolean | string> | boolean | string, key: OrderByOptions): Observable<OrderBySelection> {
  if (value instanceof Observable) {
    return map
      .call(value, (value: boolean): OrderBySelection => {
        return ({ value, key });
      });
  } else {
    return new Observable<OrderBySelection>(subscriber => {
      subscriber.next({ key, value });
    });
  }

}

function mapToLimitToSelection(value: Observable<number> | number, key: LimitToOptions): Observable<LimitToSelection> {
  if (value instanceof Observable) {
    return map
      .call(value, (value: number): LimitToSelection => ({ value, key }));
  } else {
    return new Observable<LimitToSelection>(subscriber => {
      subscriber.next({ key, value });
    });
  }
}

function hasObservableProperties(query: Query): boolean {
  return query.orderByKey instanceof Observable;
}

function isPresent(val: any): boolean {
  return val !== undefined && val !== null;
}

