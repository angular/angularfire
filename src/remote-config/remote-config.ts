import { Injectable, Inject, Optional, NgZone, InjectionToken, PLATFORM_ID } from '@angular/core';
import { Observable, concat, of, pipe, OperatorFunction, UnaryFunction } from 'rxjs';
import { map, switchMap, tap, shareReplay, distinctUntilChanged, filter, groupBy, mergeMap, scan, withLatestFrom, startWith } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, ɵlazySDKProxy, FIREBASE_OPTIONS, FIREBASE_APP_NAME } from '@angular/fire';
import { remoteConfig } from 'firebase/app';

export interface DefaultConfig {[key:string]: string|number|boolean};

export const REMOTE_CONFIG_SETTINGS = new InjectionToken<remoteConfig.Settings>('angularfire2.remoteConfig.settings');
export const DEFAULT_CONFIG = new InjectionToken<DefaultConfig>('angularfire2.remoteConfig.defaultConfig');

import { FirebaseRemoteConfig, _firebaseAppFactory, runOutsideAngular } from '@angular/fire';
import { isPlatformServer } from '@angular/common';

// SEMVER: once we move to Typescript 3.6 use `PromiseProxy<remoteConfig.RemoteConfig>` rather than hardcoding
type RemoteConfigProxy = {
  activate: () => Promise<boolean>;
  ensureInitialized: () => Promise<void>;
  fetch: () => Promise<void>;
  fetchAndActivate: () => Promise<boolean>;
  getAll: () => Promise<{[key:string]: remoteConfig.Value}>;
  getBoolean: (key:string) => Promise<boolean>;
  getNumber: (key:string) => Promise<number>;
  getString: (key:string) => Promise<string>;
  getValue: (key:string) => Promise<remoteConfig.Value>;
  setLogLevel: (logLevel: remoteConfig.LogLevel) => Promise<void>;
  settings: Promise<remoteConfig.Settings>;
  defaultConfig: Promise<{
      [key: string]: string | number | boolean;
  }>;
  fetchTimeMillis: Promise<number>;
  lastFetchStatus: Promise<remoteConfig.FetchStatus>;
};

export interface AngularFireRemoteConfig extends RemoteConfigProxy {};

// TODO export as implements Partial<...> so minor doesn't break us
export class Value implements remoteConfig.Value {
  asBoolean() { return ['1', 'true', 't', 'y', 'yes', 'on'].indexOf(this._value.toLowerCase()) > -1 }
  asString() { return this._value }
  asNumber() { return Number(this._value) || 0 }
  getSource() { return this._source; }
  constructor(public _source: remoteConfig.ValueSource, public _value: string) { }
}

// SEMVER use ConstructorParameters when we can support Typescript 3.6
export class Parameter extends Value {
  constructor(public key: string, public fetchTimeMillis: number, source: remoteConfig.ValueSource, value: string) {
    super(source, value);
  }
}

// If it's a Parameter array, test any, else test the individual Parameter
const filterTest = (fn: (param:Parameter) => boolean) => filter<Parameter|Parameter[]>(it => Array.isArray(it) ? it.some(fn) : fn(it))

// Allow the user to bypass the default values and wait till they get something from the server, even if it's a cached copy;
// if used in conjuntion with first() it will only fetch RC values from the server if they aren't cached locally
export const filterRemote = () => filterTest(p => p.getSource() === 'remote');

// filterFresh allows the developer to effectively set up a maximum cache time
export const filterFresh = (howRecentInMillis: number) => filterTest(p => p.fetchTimeMillis + howRecentInMillis >= new Date().getTime());

@Injectable()
export class AngularFireRemoteConfig {

  readonly changes:    Observable<Parameter>;
  readonly parameters: Observable<Parameter[]>;
  readonly numbers:    Observable<Record<string, number>>  & Record<string, Observable<number>>;
  readonly booleans:   Observable<Record<string, boolean>> & Record<string, Observable<boolean>>;
  readonly strings:    Observable<Record<string, string>>  & Record<string, Observable<string|undefined>>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(REMOTE_CONFIG_SETTINGS) settings:remoteConfig.Settings|null,
    @Optional() @Inject(DEFAULT_CONFIG) defaultConfig:DefaultConfig|null,
    @Inject(PLATFORM_ID) platformId:Object,
    private zone: NgZone
  ) {
    
    const remoteConfig$ = of(undefined).pipe(
      // @ts-ignore zapping in the UMD in the build script
      switchMap(() => zone.runOutsideAngular(() => import('firebase/remote-config'))),
      map(() => _firebaseAppFactory(options, zone, nameOrConfig)),
      // SEMVER no need to cast once we drop older Firebase
      map(app => <remoteConfig.RemoteConfig>app.remoteConfig()),
      tap(rc => {
        if (settings) { rc.settings = settings }
        // FYI we don't load the defaults into remote config, since we have our own implementation
        // see the comment on scanToParametersArray
      }),
      startWith(undefined),
      runOutsideAngular(zone),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    const loadedRemoteConfig$ = remoteConfig$.pipe(
      filter<remoteConfig.RemoteConfig>(rc => !!rc)
    );

    let default$: Observable<{[key:string]: remoteConfig.Value}> = of(Object.keys(defaultConfig || {}).reduce(
      (c, k) => ({...c, [k]: new Value("default", defaultConfig![k].toString()) }), {}
    ));

    const existing$ = loadedRemoteConfig$.pipe(
      switchMap(rc => rc.activate().then(() => rc.getAll()))
    );

    const fresh$ = loadedRemoteConfig$.pipe(
      switchMap(rc => zone.runOutsideAngular(() => rc.fetchAndActivate().then(() => rc.getAll())))
    );

    this.parameters = concat(default$, existing$, fresh$).pipe(
      scanToParametersArray(remoteConfig$),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.changes = this.parameters.pipe(
      switchMap(params => of(...params)),
      groupBy(param => param.key),
      mergeMap(group => group.pipe(
        distinctUntilChanged()
      ))
    );

    this.strings  = proxyAll(this.parameters, 'asString');
    this.booleans = proxyAll(this.parameters, 'asBoolean');
    this.numbers  = proxyAll(this.parameters, 'asNumber');

    // TODO fix the proxy for server
    return isPlatformServer(platformId) ? this : ɵlazySDKProxy(this, remoteConfig$, zone);
  }

}

// I ditched loading the defaults into RC and a simple map for scan since we already have our own defaults implementation.
// The idea here being that if they have a default that never loads from the server, they will be able to tell via fetchTimeMillis on the Parameter.
// Also if it doesn't come from the server it won't emit again in .changes, due to the distinctUntilChanged, which we can simplify to === rather than deep comparison
const scanToParametersArray = (remoteConfig: Observable<remoteConfig.RemoteConfig|undefined>): OperatorFunction<Record<string, remoteConfig.Value>, Parameter[]> => pipe(
  withLatestFrom(remoteConfig),
  scan((existing, [all, rc]) => {
    // SEMVER use "new Set" to unique once we're only targeting es6
    // at the scale we expect remote config to be at, we probably won't see a performance hit from this unoptimized uniqueness implementation
    // const allKeys = [...new Set([...existing.map(p => p.key), ...Object.keys(all)])];
    const allKeys = [...existing.map(p => p.key), ...Object.keys(all)].filter((v, i, a) => a.indexOf(v) === i);
    return allKeys.map(key => {
      const updatedValue = all[key];
      return updatedValue ? new Parameter(key, rc ? rc.fetchTimeMillis : -1, updatedValue.getSource(), updatedValue.asString())
                : existing.find(p => p.key === key)!
    });
  }, [] as Array<Parameter>)
);

const PROXY_DEFAULTS = {'asNumber': 0, 'asBoolean': false, 'asString': undefined};


function mapToObject(fn: 'asNumber'): UnaryFunction<Observable<Parameter[]>, Observable<Record<string, number>>>;
function mapToObject(fn: 'asBoolean'): UnaryFunction<Observable<Parameter[]>, Observable<Record<string, boolean>>>;
function mapToObject(fn: 'asString'): UnaryFunction<Observable<Parameter[]>, Observable<Record<string, string|undefined>>>;
function mapToObject(fn: 'asNumber'|'asBoolean'|'asString') {
  return pipe(
    map((params: Parameter[]) => params.reduce((c, p) => ({...c, [p.key]: p[fn]()}), {} as Record<string, number|boolean|string|undefined>)),
    distinctUntilChanged((a,b) => JSON.stringify(a) === JSON.stringify(b))
  );
};

export const mapAsStrings = () => mapToObject('asString');
export const mapAsBooleans = () => mapToObject('asBoolean');
export const mapAsNumbers = () => mapToObject('asNumber');

// TODO look into the types here, I don't like the anys
const proxyAll = (observable: Observable<Parameter[]>, fn: 'asNumber'|'asBoolean'|'asString') => new Proxy(
  observable.pipe(mapToObject(fn as any)), {
    get: (self, name:string) => self[name] || self.pipe(
      map(all => all[name] || PROXY_DEFAULTS[fn]),
      distinctUntilChanged()
    )
  }
) as any;