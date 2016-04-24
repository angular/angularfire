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

export function observeQuery (query: Query): Observable<Query> {
  
  if (!isPresent(query)) {
    return new ScalarObservable(null);
  }

  if (!hasObservableProperties(query)) {
    return new ScalarObservable(query);
  }

  return Observable.create((observer: Observer<Query>) => {
    var serializedOrder:Query = {};
    
    getOrderObservables(query).subscribe((v:OrderBySelection) => {
      console.log('v', v);
      if (!isPresent(v.value)) {
        serializedOrder = {};
      } else {
        switch (v.key) {
          case OrderByOptions.Key:
            serializedOrder = {orderByKey: <boolean>v.value};
            break;
          case OrderByOptions.Priority:
            serializedOrder = {orderByPriority: <boolean>v.value};
            break;
          case OrderByOptions.Value:
            serializedOrder = {orderByValue: <boolean>v.value};
            break;
          case OrderByOptions.Child:
            serializedOrder = {orderByChild: <string>v.value};
            break;
        }
        switch (v.key) {
          case QueryOptions.EqualTo: {
            serializedOrder.equalTo = v.value;
            break;
          }
          case QueryOptions.StartAt: {
            serializedOrder.startAt = v.value;
            break;
          }
          case QueryOptions.EndAt: {
            serializedOrder.endAt = v.value;
            break;
          }
        }
      }

      // TODO: this should combine with other parts of the query
      observer.next(serializedOrder);
    });
  });
}

export function getOrderObservables(query: Query): Observable<OrderBySelection> {
  return merge.apply(null, ['orderByChild', 'orderByKey', 'orderByValue', 'orderByPriority', 'startAt', 'endAt', 'equalTo']
    .map((key:string, option:OrderByOptions) => ({ key, option }))
    .filter(({key, option}:{key: string, option: OrderByOptions}) => {
      return query[key] instanceof Observable;
    })
    .map(({key, option}) => mapToOrderBySelection(<any>query[key], option)));
}

function mapToOrderBySelection (obs:Observable<boolean|string>, key:OrderByOptions): Observable<OrderBySelection> {
  return map
    .call(obs, (value: boolean):OrderBySelection => {
      console.log({ value, key});
      return ({ value, key});
    });
}

function hasObservableProperties(query: Query): boolean {
  if (query.orderByKey instanceof Observable) return true;
  return false;
}

function isPresent(val: any): boolean {
  return val !== undefined && val !== null;
}

