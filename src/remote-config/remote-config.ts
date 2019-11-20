import { Injectable, Inject, Optional, NgZone, InjectionToken } from '@angular/core';
import { Observable, concat, of, empty } from 'rxjs';
import { map, switchMap, tap, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, _lazySDKProxy, FIREBASE_OPTIONS, FIREBASE_APP_NAME } from '@angular/fire';
import { remoteConfig } from 'firebase/app';

export interface DefaultConfig {[key:string]: string|number|boolean};

export const REMOTE_CONFIG_SETTINGS = new InjectionToken<remoteConfig.Settings>('angularfire2.remoteConfig.settings');
export const DEFAULT_CONFIG = new InjectionToken<DefaultConfig>('angularfire2.remoteConfig.defaultConfig');

import { FirebaseRemoteConfig, _firebaseAppFactory, runOutsideAngular } from '@angular/fire';
import { AngularFireRemoteConfigModule } from './remote-config.module';

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
export class KeyedValue extends Value {
  constructor(private key: string, source: remoteConfig.ValueSource, value: string) {
    super(source, value);
  }
}

@Injectable({
  providedIn: AngularFireRemoteConfigModule
})
export class AngularFireRemoteConfig {

  private default$: Observable<{[key:string]: remoteConfig.Value}>;

  readonly changes: Observable<{key:string} & remoteConfig.Value>;
  readonly values: Observable<{[key:string]: remoteConfig.Value}> & {[key:string]: Observable<remoteConfig.Value>};
  readonly numbers: Observable<{[key:string]: number}> & {[key:string]: Observable<number>};
  readonly booleans: Observable<{[key:string]: boolean}> & {[key:string]: Observable<boolean>};
  readonly strings: Observable<{[key:string]: string}> & {[key:string]: Observable<string>};

  constructor(
    @Inject(FIREBASE_OPTIONS) options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(REMOTE_CONFIG_SETTINGS) settings:remoteConfig.Settings|null,
    @Optional() @Inject(DEFAULT_CONFIG) defaultConfig:DefaultConfig|null,
    private zone: NgZone
  ) {

    const remoteConfig = of(undefined).pipe(
      // @ts-ignore zapping in the UMD in the build script
      switchMap(() => import('firebase/remote-config')),
      map(() => _firebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.remoteConfig()),
      tap(rc => {
        if (settings) { rc.settings = settings }
        if (defaultConfig) { rc.defaultConfig = defaultConfig }
        this.default$ = empty(); // once the SDK is loaded, we don't need our defaults anylonger
      }),
      runOutsideAngular(zone),
      shareReplay(1)
    );

    const defaultToStartWith = Object.keys(defaultConfig || {}).reduce((c, k) => {
      c[k] = new Value("default", defaultConfig![k].toString());
      return c;
    }, {} as {[key:string]: remoteConfig.Value});

    const mapRemoteConfig = (rc: {[key:string]: Value | remoteConfig.Value}) => {
      const keys = Object.keys(rc);
      return keys.reduce((c, key, index) => {
        const value = rc[key];
        c[index] = new KeyedValue(key, value.getSource(), value.asString());
        return c;
      }, new Array<KeyedValue>(keys.length));
    }

    const proxy: AngularFireRemoteConfig = _lazySDKProxy(this, remoteConfig, zone);

    this.default$ = of(defaultToStartWith);

    const existing = of(undefined).pipe(
      switchMap(() => proxy.activate()),
      switchMap(() => proxy.getAll())
    );

    let fresh = of(undefined).pipe(
      switchMap(() => proxy.fetchAndActivate()),
      switchMap(() => proxy.getAll())
    );

    this.values = new Proxy(concat(this.default$, existing, fresh), {
      get: (self, name:string) => self[name] || self.pipe(
        map(rc => rc[name] ? rc[name] : undefined),
        distinctUntilChanged((a,b) => JSON.stringify(a) === JSON.stringify(b))
      )
    }) as any; // TODO figure out the types here

    this.changes = this.values.pipe(
      switchMap(all => of(...mapRemoteConfig(all)))
    ) as any; // TODO figure out the types here

    const allAs = (type: 'String'|'Boolean'|'Number') => this.values.pipe(
      map(all => Object.keys(all).reduce((c, k) => {
        c[k] = all[k][`as${type}`]();
        return c;
      }, {}))
    ) as any; // TODO figure out the types here

    this.strings = new Proxy(allAs('String'), {
      get: (self, name:string) => self[name] || this.values.pipe(
        map(rc => rc[name] ? rc[name].asString() : undefined),
        distinctUntilChanged()
      )
    });

    this.booleans = new Proxy(allAs('Boolean'), {
      get: (self, name:string) => self[name] || this.values.pipe(
        map(rc => rc[name] ? rc[name].asBoolean() : false),
        distinctUntilChanged()
      )
    });

    this.numbers = new Proxy(allAs('Number'), {
      get: (self, name:string) => self[name] || this.values.pipe(
        map(rc => rc[name] ? rc[name].asNumber() : 0),
        distinctUntilChanged()
      )
    });

    return proxy;
  }

}
