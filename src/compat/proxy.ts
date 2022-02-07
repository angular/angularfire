import { NgZone } from '@angular/core';
import { Observable } from 'rxjs';

type MyFunction = (...args: any[]) => any;
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends MyFunction ? K : never }[keyof T];
type ReturnTypeOrNever<T> = T extends MyFunction ? ReturnType<T> : never;
type ParametersOrNever<T> = T extends MyFunction ? Parameters<T> : never;
type PromiseReturningFunctionPropertyNames<T> = {
  [K in FunctionPropertyNames<T>]: ReturnTypeOrNever<T[K]> extends Promise<any> ? K : never
}[FunctionPropertyNames<T>];
type NonPromiseReturningFunctionPropertyNames<T> = {
  [K in FunctionPropertyNames<T>]: ReturnTypeOrNever<T[K]> extends Promise<any> ? never : K
}[FunctionPropertyNames<T>];
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends MyFunction ? never : K }[keyof T];

export type ɵPromiseProxy<T> = { [K in NonFunctionPropertyNames<T>]: Promise<T[K]> } &
  { [K in NonPromiseReturningFunctionPropertyNames<T>]: (...args: ParametersOrNever<T[K]>) => Promise<ReturnTypeOrNever<T[K]>> } &
  { [K in PromiseReturningFunctionPropertyNames<T>]: T[K] };

// DEBUG quick debugger function for inline logging that typescript doesn't complain about
//       wrote it for debugging the ɵlazySDKProxy, commenting out for now; should consider exposing a
//       verbose mode for AngularFire in a future release that uses something like this in multiple places
//       usage: () => log('something') || returnValue
// const log = (...args: any[]): false => { console.log(...args); return false }

// The problem here are things like ngOnDestroy are missing, then triggering the service
// rather than dig too far; I'm capturing these as I go.
const noopFunctions = ['ngOnDestroy'];

// INVESTIGATE should we make the Proxy revokable and do some cleanup?
//             right now it's fairly simple but I'm sure this will grow in complexity
export const ɵlazySDKProxy = (klass: any, observable: Observable<any>, zone: NgZone, options: {
  spy?: {
    get?: ((name: string, it: any) => void),
    apply?: ((name: string, args: any[], it: any) => void)
  }
} = {}) => {
  return new Proxy(klass, {
    get: (_, name: string) => zone.runOutsideAngular(() => {
      if (klass[name]) {
        if (options?.spy?.get) {
          options.spy.get(name, klass[name]);
        }
        return klass[name];
      }
      if (noopFunctions.indexOf(name) > -1) {
        return () => {
        };
      }
      const promise = observable.toPromise().then(mod => {
        const ret = mod && mod[name];
        // TODO move to proper type guards
        if (typeof ret === 'function') {
          return ret.bind(mod);
        } else if (ret && ret.then) {
          return ret.then((res: any) => zone.run(() => res));
        } else {
          return zone.run(() => ret);
        }
      });
      // recurse the proxy
      return new Proxy(() => {}, {
          get: (_, name) => promise[name],
          // TODO handle callbacks as transparently as I can
          apply: (self, _, args) => promise.then(it => {
            const res = it && it(...args);
            if (options?.spy?.apply) {
              options.spy.apply(name, args, res);
            }
            return res;
          })
        }
      );
    })
  });
};

export const ɵapplyMixins = (derivedCtor: any, constructors: any[]) => {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype || baseCtor).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype || baseCtor, name)
      );
    });
  });
};
