import { Observable, of as observableOf, Operator, Observer } from 'rxjs';
import { auditTime, combineLatest, merge, map } from 'rxjs/operators';
import { Query, ScalarQuery, OrderByOptions, OrderBySelection, LimitToOptions, LimitToSelection, Primitive } from './interfaces';
import { hasKey, isNil } from './utils';

export function observeQuery(query: Query, audit: boolean = true): Observable<ScalarQuery> {
  if (isNil(query)) {
    return observableOf(null!);
  }

  return Observable.create((observer: Observer<ScalarQuery>) => {

    let combined = combineLatest.call(
      getOrderObservables(query),
      getStartAtObservable(query),
      getEndAtObservable(query),
      getEqualToObservable(query),
      getLimitToObservables(query)
    );
    if (audit) {
      combined = auditTime.call(combined, 0);
    }
    combined
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

        if (startAt !== undefined) {
          serializedOrder.startAt = startAt;
        }

        if (endAt !== undefined) {
          serializedOrder.endAt = endAt;
        }

        if (equalTo !== undefined) {
          serializedOrder.equalTo = equalTo;
        }

        observer.next(serializedOrder);
      });
  });
}

export function getOrderObservables(query: Query): Observable<OrderBySelection> {
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
    return merge.apply(observables[0], observables.slice(1));
  } else {
    return new Observable<OrderBySelection>(subscriber => {
      subscriber.next(null!);
    });
  }
}

export function getLimitToObservables(query: Query): Observable<LimitToSelection> {
  var observables = ['limitToFirst', 'limitToLast']
    .map((key: string, option: LimitToOptions) => ({ key, option }))
    .filter(({key, option}: { key: string, option: LimitToOptions }) => !isNil(query[key]))
    .map(({key, option}) => mapToLimitToSelection(<any>query[key], option));

  if (observables.length === 1) {
    return observables[0];
  } else if (observables.length > 1) {
    const mergedObs = merge.apply(observables[0], observables.slice(1));
    return mergedObs;
  } else {
    return new Observable<LimitToSelection>(subscriber => {
      subscriber.next(null!);
    });
  }
}

export function getStartAtObservable(query: Query): Observable<Primitive> {
  if (query.startAt instanceof Observable) {
    return query.startAt;
  } else if (hasKey(query, 'startAt')) {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(query.startAt);
    });
  } else {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(undefined);
    });
  }
}

export function getEndAtObservable(query: Query): Observable<Primitive> {
  if (query.endAt instanceof Observable) {
    return query.endAt;
  } else if (hasKey(query, 'endAt')) {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(query.endAt);
    });
  } else {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(undefined);
    });
  }
}

export function getEqualToObservable(query: Query): Observable<Primitive> {
  if (query.equalTo instanceof Observable) {
    return query.equalTo;
  } else if (hasKey(query, 'equalTo')) {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(query.equalTo);
    });
  } else {
    return new Observable<Primitive>(subscriber => {
      subscriber.next(undefined);
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
