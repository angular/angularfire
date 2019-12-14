import { Injectable, Inject, Optional, NgZone, InjectionToken, PLATFORM_ID } from '@angular/core';
import { Observable, concat, of, empty, pipe, OperatorFunction } from 'rxjs';
import { map, switchMap, tap, shareReplay, distinctUntilChanged, filter, groupBy, mergeMap } from 'rxjs/operators';
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

type Filter<T, K={}, M=any> = T extends {[key:string]: M} ?
                                OperatorFunction<T, {[key:string]: M & K}> :
                                OperatorFunction<T, T & K>;

const filterKey = (attribute: any, test: (param:any) => boolean) => pipe(
  map((value:Parameter | Record<string, Parameter>) => {
    const param = value[attribute];
    if (param) {
      if (test(param)) {
        return value;
      } else {
        return undefined;
      }
    } else {
      const filtered = Object.keys(value).reduce((c, k) => {
        if (test(value[k][attribute])) {
          return {...c, [k]: value[k]};
        } else {
          return c;
        }
      }, {});
      return Object.keys(filtered).length > 0 ? filtered : undefined
    }
  }),
  filter(a => !!a)
) as any; // TODO figure out the typing here

export const filterStatic = <T>(): Filter<T, {_source: 'static', getSource: () => 'static'}> => filterKey('_source', s => s === 'static');
export const filterRemote = <T>(): Filter<T, {_source: 'remote', getSource: () => 'remote'}> => filterKey('_source', s => s === 'remote');
export const filterDefault = <T>(): Filter<T, {_source: 'default', getSource: () => 'default'}> => filterKey('_source', s => s === 'default');

const DEFAULT_INTERVAL = 60 * 60 * 1000; // 1 hour
export const filterFresh = <T>(howRecentInMillis: number = DEFAULT_INTERVAL): OperatorFunction<T, T> => filterKey('fetchTimeMillis', f => f + howRecentInMillis >= new Date().getTime());

@Injectable()
export class AngularFireRemoteConfig {

  readonly changes:  Observable<Parameter>;
  readonly values:   Observable<Record<string, Parameter>> & Record<string, Observable<Parameter>>;
  readonly numbers:  Observable<Record<string, number>>    & Record<string, Observable<number>>;
  readonly booleans: Observable<Record<string, boolean>>   & Record<string, Observable<boolean>>;
  readonly strings:  Observable<Record<string, string>>    & Record<string, Observable<string>>;

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(REMOTE_CONFIG_SETTINGS) settings:remoteConfig.Settings|null,
    @Optional() @Inject(DEFAULT_CONFIG) defaultConfig:DefaultConfig|null,
    @Inject(PLATFORM_ID) platformId:Object,
    private zone: NgZone
  ) {

    let default$: Observable<{[key:string]: remoteConfig.Value}> = of(Object.keys(defaultConfig || {}).reduce(
      (c, k) => ({...c, [k]: new Value("default", defaultConfig![k].toString()) }), {}
    ));

    let _remoteConfig: remoteConfig.RemoteConfig|undefined = undefined;
    const fetchTimeMillis = () => _remoteConfig && _remoteConfig.fetchTimeMillis || -1;
    
    const remoteConfig = of(undefined).pipe(
      // @ts-ignore zapping in the UMD in the build script
      switchMap(() => zone.runOutsideAngular(() => import('firebase/remote-config'))),
      map(() => _firebaseAppFactory(options, zone, nameOrConfig)),
      // SEMVER no need to cast once we drop older Firebase
      map(app => <remoteConfig.RemoteConfig>app.remoteConfig()),
      tap(rc => {
        if (settings) { rc.settings = settings }
        if (defaultConfig) { rc.defaultConfig = defaultConfig }
        default$ = empty(); // once the SDK is loaded, we don't need our defaults anylonger
        _remoteConfig = rc; // hack, keep the state around for easy injection of fetchTimeMillis
      }),
      runOutsideAngular(zone),
      shareReplay(1)
    );

    const existing = of(undefined).pipe(
      switchMap(() => remoteConfig),
      switchMap(rc => rc.activate().then(() => rc.getAll()))
    );

    let fresh = of(undefined).pipe(
      switchMap(() => remoteConfig),
      switchMap(rc => zone.runOutsideAngular(() => rc.fetchAndActivate().then(() => rc.getAll())))
    );

    const all = concat(default$, existing, fresh).pipe(
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      map(all => Object.keys(all).reduce((c, k) => ({...c, [k]: new Parameter(k, fetchTimeMillis(), all[k].getSource(), all[k].asString())}), {} as Record<string, Parameter>)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.changes = all.pipe(
      map(all => Object.values(all)),
      switchMap(params => of(...params)),
      groupBy(param => param.key),
      mergeMap(group => group.pipe(
        distinctUntilChanged((a,b) => JSON.stringify(a) === JSON.stringify(b))
      ))
    );

    this.values = new Proxy(all, {
      get: (self, name:string) => self[name] || all.pipe(
        map(rc => rc[name] ? rc[name] : undefined),
        distinctUntilChanged((a,b) => JSON.stringify(a) === JSON.stringify(b))
      )
    }) as any; // TODO types

    // TODO change the any, once i figure out how to type the proxies better
    const allAs = (type: 'Number'|'Boolean'|'String') => all.pipe(
      map(all => Object.values(all).reduce((c, p) => ({...c, [p.key]: p[`as${type}`]()}), {})),
      distinctUntilChanged((a,b) => JSON.stringify(a) === JSON.stringify(b))
    ) as any;

    this.strings = new Proxy(allAs('String'), {
      get: (self, name:string) => self[name] || all.pipe(
        map(rc => rc[name] ? rc[name].asString() : undefined),
        distinctUntilChanged()
      )
    });

    this.booleans = new Proxy(allAs('Boolean'), {
      get: (self, name:string) => self[name] || all.pipe(
        map(rc => rc[name] ? rc[name].asBoolean() : false),
        distinctUntilChanged()
      )
    });

    this.numbers = new Proxy(allAs('Number'), {
      get: (self, name:string) => self[name] || all.pipe(
        map(rc => rc[name] ? rc[name].asNumber() : 0),
        distinctUntilChanged()
      )
    });

    // TODO fix the proxy for server
    return isPlatformServer(platformId) ? this : ɵlazySDKProxy(this, remoteConfig, zone);
  }

}
