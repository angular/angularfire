import { Observable } from 'rxjs/Observable';
import { of as observableOf } from  'rxjs/observable/of';
import { Operator } from 'rxjs/Operator';
import { Observer } from 'rxjs/Observer';
import { combineLatest } from 'rxjs/operator/combineLatest';
import { merge } from 'rxjs/operator/merge';
import { map } from 'rxjs/operator/map';
import {
  Query,
  ScalarQuery,
  OrderByOptions,
  OrderBySelection,
  LimitToOptions,
  LimitToSelection,
  Primitive
} from '../interfaces';
import { isNil } from '../utils';

export function observeQuery(query: Query): Observable<ScalarQuery> {
  if (isNil(query)) {
    return observableOf(null);
  }

  return Observable.create((observer: Observer<ScalarQuery>) => {

    let obs = getOrderObservables(query) as Observable<OrderBySelection>;
    combineLatest.call(obs,
        getStartAtObservable(query),
        getEndAtObservable(query),
        getEqualToObservable(query),
        getLimitToObservables(query)
      )
      .subscribe(([orderBy, startAt, endAt, equalTo, limitTo]
        : [OrderBySelection, Primitive, Primitive, Primitive, LimitToSelection]) => {

        let serializedOrder: any = {};
        if (!isNil(orderBy) && !isNil(orderBy.value)) {
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

        if (!isNil(limitTo) && !isNil(limitTo.value)) {
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

        if (!isNil(startAt)) {
          serializedOrder.startAt = startAt;
        }

        if (!isNil(endAt)) {
          serializedOrder.endAt = endAt;
        }

        if (!isNil(equalTo)) {
          serializedOrder.equalTo = equalTo;
        }

        observer.next(serializedOrder);
      });
  });
}

export function getOrderObservables(query: Query): Observable<OrderBySelection> | Observable<OrderBySelection | Observable<OrderBySelection>> {
  var observables = ['orderByChild', 'orderByKey', 'orderByValue', 'orderByPriority']
    .map((key: string, option: OrderByOptions) => {
      return ({ key, option })
    })
    .filter(({key, option}: { key: string, option: OrderByOptions }) => {
      return !isNil(query[key]);
    })
    .map(({key, option}) => mapToOrderBySelection(<any>query[key], option));

  if (observables.length === 1) {
    return observables[0];
  } else if (observables.length > 1) {
    return merge.call(observables[0], observables.slice(1));
  } else {
    return new Observable<OrderBySelection>(subscriber => {
      subscriber.next(null);
    });
  }
}

export function getLimitToObservables(query: Query): Observable<LimitToSelection> | Observable<LimitToSelection | Observable<LimitToSelection>> {
  var observables = ['limitToFirst', 'limitToLast']
    .map((key: string, option: LimitToOptions) => ({ key, option }))
    .filter(({key, option}: { key: string, option: LimitToOptions }) => !isNil(query[key]))
    .map(({key, option}) => mapToLimitToSelection(<any>query[key], option));

  if (observables.length === 1) {
    return observables[0];
  } else if (observables.length > 1) {
    const mergedObs = merge.call(observables[0], observables.slice(1));
    return mergedObs;
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
  if (query.orderByKey instanceof Observable) return true;
  return false;
}
