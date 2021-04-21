import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { concat, EMPTY, MonoTypeOperatorFunction, Observable, of, OperatorFunction, pipe } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  groupBy,
  map,
  mergeMap,
  observeOn,
  scan,
  shareReplay,
  startWith,
  switchMap,
  withLatestFrom
} from 'rxjs/operators';
import {
  ɵAngularFireSchedulers,
  ɵkeepUnstableUntilFirstFactory,
  ɵlazySDKProxy,
  ɵPromiseProxy,
  ɵapplyMixins
} from '@angular/fire';
import { FirebaseOptions } from 'firebase/app';
import { ɵfirebaseAppFactory, FIREBASE_APP_NAME, FIREBASE_OPTIONS } from '@angular/fire/compat';
import { isPlatformBrowser } from '@angular/common';
import firebase from 'firebase/compat/app';
import { Settings } from './interfaces';
import { proxyPolyfillCompat } from './base';
import { ɵfetchInstance } from '@angular/fire';

export interface ConfigTemplate {
  [key: string]: string | number | boolean;
}

export const SETTINGS = new InjectionToken<Settings>('angularfire2.remoteConfig.settings');
export const DEFAULTS = new InjectionToken<ConfigTemplate>('angularfire2.remoteConfig.defaultConfig');

export interface AngularFireRemoteConfig extends ɵPromiseProxy<firebase.remoteConfig.RemoteConfig> {
}

const AS_TO_FN = { strings: 'asString', numbers: 'asNumber', booleans: 'asBoolean' };
const STATIC_VALUES = { numbers: 0, booleans: false, strings: undefined };

// TODO look into the types here, I don't like the anys
const proxyAll = (observable: Observable<Parameter[]>, as: 'numbers' | 'booleans' | 'strings') => new Proxy(
  observable.pipe(mapToObject(as as any)), {
    get: (self, name: string) => self[name] || observable.pipe(
      map(all => all.find(p => p.key === name)),
      map(param => param ? param[AS_TO_FN[as]]() : STATIC_VALUES[as]),
      distinctUntilChanged()
    )
  }
) as any;

// TODO export as implements Partial<...> so minor doesn't break us
export class Value implements firebase.remoteConfig.Value {
  asBoolean() {
    return ['1', 'true', 't', 'y', 'yes', 'on'].indexOf(this._value.toLowerCase()) > -1;
  }

  asString() {
    return this._value;
  }

  asNumber() {
    return Number(this._value) || 0;
  }

  getSource() {
    return this._source;
  }

  // tslint:disable-next-line:variable-name
  constructor(public _source: firebase.remoteConfig.ValueSource, public _value: string) {
  }
}

// SEMVER use ConstructorParameters when we can support Typescript 3.6
export class Parameter extends Value {
  constructor(public key: string, public fetchTimeMillis: number, source: firebase.remoteConfig.ValueSource, value: string) {
    super(source, value);
  }
}

// If it's a Parameter array, test any, else test the individual Parameter
const filterTest = (fn: (param: Parameter) => boolean) => filter<Parameter | Parameter[]>(it => Array.isArray(it) ? it.some(fn) : fn(it));

// Allow the user to bypass the default values and wait till they get something from the server, even if it's a cached copy;
// if used in conjuntion with first() it will only fetch RC values from the server if they aren't cached locally
export const filterRemote = () => filterTest(p => p.getSource() === 'remote');

// filterFresh allows the developer to effectively set up a maximum cache time
export const filterFresh = (howRecentInMillis: number) => filterTest(p => p.fetchTimeMillis + howRecentInMillis >= new Date().getTime());


// I ditched loading the defaults into RC and a simple map for scan since we already have our own defaults implementation.
// The idea here being that if they have a default that never loads from the server, they will be able to tell via fetchTimeMillis
// on the Parameter. Also if it doesn't come from the server it won't emit again in .changes, due to the distinctUntilChanged,
// which we can simplify to === rather than deep comparison
const scanToParametersArray = (
  remoteConfig: Observable<firebase.remoteConfig.RemoteConfig | undefined>
): OperatorFunction<{ [key: string]: firebase.remoteConfig.Value }, Parameter[]> => pipe(
  withLatestFrom(remoteConfig),
  scan((existing, [all, rc]) => {
    // SEMVER use "new Set" to unique once we're only targeting es6
    // at the scale we expect remote config to be at, we probably won't see a performance hit from this unoptimized uniqueness
    // implementation.
    // const allKeys = [...new Set([...existing.map(p => p.key), ...Object.keys(all)])];
    const allKeys = [...existing.map(p => p.key), ...Object.keys(all)].filter((v, i, a) => a.indexOf(v) === i);
    return allKeys.map(key => {
      const updatedValue = all[key];
      return updatedValue ? new Parameter(key, rc ? rc.fetchTimeMillis : -1, updatedValue.getSource(), updatedValue.asString())
        : existing.find(p => p.key === key);
    });
  }, [] as Array<Parameter>)
);


@Injectable({
  providedIn: 'any'
})
export class AngularFireRemoteConfig {

  readonly changes: Observable<Parameter>;
  readonly parameters: Observable<Parameter[]>;
  readonly numbers: Observable<{ [key: string]: number | undefined }> & { [key: string]: Observable<number> };
  readonly booleans: Observable<{ [key: string]: boolean | undefined }> & { [key: string]: Observable<boolean> };
  readonly strings: Observable<{ [key: string]: string | undefined }> & { [key: string]: Observable<string | undefined> };

  constructor(
    @Inject(FIREBASE_OPTIONS) options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) name: string | null | undefined,
    @Optional() @Inject(SETTINGS) settings: Settings | null,
    @Optional() @Inject(DEFAULTS) defaultConfig: ConfigTemplate | null,
    private zone: NgZone,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object
  ) {

    const schedulers = new ɵAngularFireSchedulers(zone);

    const remoteConfig$ = of(undefined).pipe(
      observeOn(schedulers.outsideAngular),
      switchMap(() => isPlatformBrowser(platformId) ? import('firebase/compat/remote-config') : EMPTY),
      switchMap(() => import('@firebase/remote-config')),
      map(() => ɵfirebaseAppFactory(options, zone, name)),
      map(app => ɵfetchInstance(`${app.name}.remote-config`, 'AngularFireRemoteConfig', app, () => {
        const rc = app.remoteConfig();
        if (settings) {
          rc.settings = settings;
        }
        if (defaultConfig) {
          rc.defaultConfig = defaultConfig;
        }
        return rc;
      }, [settings, defaultConfig])),
      // tslint:disable-next-line
      startWith(undefined),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    const loadedRemoteConfig$ = remoteConfig$.pipe(
      filter<firebase.remoteConfig.RemoteConfig>(rc => !!rc)
    );

    const default$: Observable<{ [key: string]: firebase.remoteConfig.Value }> = of(Object.keys(defaultConfig || {}).reduce(
      (c, k) => ({ ...c, [k]: new Value('default', defaultConfig[k].toString()) }), {}
    ));

    // we should filter out the defaults we provided to RC, since we have our own implementation
    // that gives us a -1 for fetchTimeMillis (so filterFresh can filter them out)
    const filterOutDefaults = map<{ [key: string]: firebase.remoteConfig.Value }, { [key: string]: firebase.remoteConfig.Value }>(all =>
      Object.keys(all)
        .filter(key => all[key].getSource() !== 'default')
        .reduce((acc, key) => ({ ...acc, [key]: all[key] }), {})
    );

    const existing$ = loadedRemoteConfig$.pipe(
      switchMap(rc =>
        rc.activate()
          .then(() => rc.ensureInitialized())
          .then(() => rc.getAll())
      ),
      filterOutDefaults
    );

    const fresh$ = loadedRemoteConfig$.pipe(
      switchMap(rc => zone.runOutsideAngular(() =>
        rc.fetchAndActivate()
          .then(() => rc.ensureInitialized())
          .then(() => rc.getAll())
      )),
      filterOutDefaults
    );

    this.parameters = concat(default$, existing$, fresh$).pipe(
      scanToParametersArray(remoteConfig$),
      ɵkeepUnstableUntilFirstFactory(schedulers),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.changes = this.parameters.pipe(
      switchMap(params => of(...params)),
      groupBy(param => param.key),
      mergeMap(group => group.pipe(
        distinctUntilChanged()
      ))
    );

    this.strings = proxyAll(this.parameters, 'strings');
    this.booleans = proxyAll(this.parameters, 'booleans');
    this.numbers = proxyAll(this.parameters, 'numbers');

    return ɵlazySDKProxy(this, loadedRemoteConfig$, zone);
  }

}


export const budget = <T>(interval: number): MonoTypeOperatorFunction<T> => (source: Observable<T>) => new Observable<T>(observer => {
  let timedOut = false;
  // TODO use scheduler task rather than settimeout
  const timeout = setTimeout(() => {
    observer.complete();
    timedOut = true;
  }, interval);
  return source.subscribe({
    next(val) {
      if (!timedOut) {
        observer.next(val);
      }
    },
    error(err) {
      if (!timedOut) {
        clearTimeout(timeout);
        observer.error(err);
      }
    },
    complete() {
      if (!timedOut) {
        clearTimeout(timeout);
        observer.complete();
      }
    }
  });
});

const typedMethod = (it: any) => {
  switch (typeof it) {
    case 'string':
      return 'asString';
    case 'boolean':
      return 'asBoolean';
    case 'number':
      return 'asNumber';
    default:
      return 'asString';
  }
};


export function scanToObject(): OperatorFunction<Parameter, { [key: string]: string | undefined }>;
export function scanToObject(to: 'numbers'): OperatorFunction<Parameter, { [key: string]: number | undefined }>;
export function scanToObject(to: 'booleans'): OperatorFunction<Parameter, { [key: string]: boolean | undefined }>;
// tslint:disable-next-line:unified-signatures
export function scanToObject(to: 'strings'): OperatorFunction<Parameter, { [key: string]: string | undefined }>;
export function scanToObject<T extends ConfigTemplate>(template: T): OperatorFunction<Parameter, T & { [key: string]: string | undefined }>;
export function scanToObject<T extends ConfigTemplate>(to: 'numbers' | 'booleans' | 'strings' | T = 'strings') {
  return pipe(
    // TODO cleanup
    scan(
      (c, p: Parameter) => ({
        ...c, [p.key]: typeof to === 'object' ?
          p[typedMethod(to[p.key])]() :
          p[AS_TO_FN[to]]()
      }),
      typeof to === 'object' ?
        to as T & { [key: string]: string | undefined } :
        {} as { [key: string]: number | boolean | string }
    ),
    debounceTime(1),
    budget(10),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );
}

export function mapToObject(): OperatorFunction<Parameter[], { [key: string]: string | undefined }>;
export function mapToObject(to: 'numbers'): OperatorFunction<Parameter[], { [key: string]: number | undefined }>;
export function mapToObject(to: 'booleans'): OperatorFunction<Parameter[], { [key: string]: boolean | undefined }>;
// tslint:disable-next-line:unified-signatures
export function mapToObject(to: 'strings'): OperatorFunction<Parameter[], { [key: string]: string | undefined }>;
export function mapToObject<T extends ConfigTemplate>(template: T):
  OperatorFunction<Parameter[], T & { [key: string]: string | undefined }>;
export function mapToObject<T extends ConfigTemplate>(to: 'numbers' | 'booleans' | 'strings' | T = 'strings') {
  return pipe(
    // TODO this is getting a little long, cleanup
    map((params: Parameter[]) => params.reduce(
      (c, p) => ({
        ...c, [p.key]: typeof to === 'object' ?
          p[typedMethod(to[p.key])]() :
          p[AS_TO_FN[to]]()
      }),
      typeof to === 'object' ?
        to as T & { [key: string]: string | undefined } :
        {} as { [key: string]: number | boolean | string }
    )),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );
}

ɵapplyMixins(AngularFireRemoteConfig, [proxyPolyfillCompat]);
