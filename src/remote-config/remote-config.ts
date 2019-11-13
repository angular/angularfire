import { Injectable, Inject, Optional, NgZone, InjectionToken } from '@angular/core';
import { Observable, from, concat } from 'rxjs';
import { map, switchMap, tap, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, _lazySDKProxy, FIREBASE_OPTIONS, FIREBASE_APP_NAME } from '@angular/fire';
import { remoteConfig } from 'firebase/app';

// @ts-ignore
import firebase from 'firebase/app';

export interface DefaultConfig {[key:string]: string|number|boolean};

export const REMOTE_CONFIG_SETTINGS = new InjectionToken<remoteConfig.Settings>('angularfire2.remoteConfig.settings');
export const DEFAULT_CONFIG = new InjectionToken<DefaultConfig>('angularfire2.remoteConfig.defaultConfig');

import { FirebaseRemoteConfig, _firebaseAppFactory, runOutsideAngular } from '@angular/fire';

// SEMVER: once we move to Typescript 3.6 use `PromiseProxy<remoteConfig.RemoteConfig>` rather than hardcoding
type RemoteConfigProxy = {
  activate: () => Promise<void>;
  ensureInitialized: () => Promise<void>;
  fetch: () => Promise<void>;
  fetchAndActivate: () => Promise<void>;
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

@Injectable()
export class AngularFireRemoteConfig {

  private readonly remoteConfig$: Observable<remoteConfig.RemoteConfig>;
  private get remoteConfig() { return this.remoteConfig$.toPromise(); }

  readonly all: Observable<{[key:string]: remoteConfig.Value}>;
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
    // import('firebase/remote-config') isn't working for some reason...
    // it might have something to do with https://github.com/firebase/firebase-js-sdk/pull/2229
    // import from @firebase/remote-config so I can manually register on the Firebase instance
    // @ts-ignore zapping in the UMD in the build script
    const requireRemoteConfig = from(import('@firebase/remote-config'));

    this.remoteConfig$ = requireRemoteConfig.pipe(
      map(rc => rc.registerRemoteConfig(firebase)),
      map(() => _firebaseAppFactory(options, zone, nameOrConfig)),
      map(app => app.remoteConfig()),
      tap(rc => {
        if (settings) { rc.settings = settings }
        if (defaultConfig) { rc.defaultConfig = defaultConfig }
      }),
      runOutsideAngular(zone),
      shareReplay(1)
    );

    this.all = this.remoteConfig$.pipe(
      switchMap(rc => concat(
        rc.activate().then(() => rc.getAll()),
        rc.fetchAndActivate().then(() => rc.getAll())
      )),
      runOutsideAngular(zone),
      // TODO startWith(rehydrate(deafultConfig)),
      shareReplay(1)
      // TODO distinctUntilChanged(compareFn)
    );

    const allAs = (type: 'String'|'Boolean'|'Number') => this.all.pipe(
      map(all => Object.keys(all).reduce((c, k) => {
        c[k] = all[k][`as${type}`]();
        return c;
      }, {}))
    ) as any;

    this.strings = new Proxy(allAs('String'), {
      get: (self, name:string) => self[name] || this.all.pipe(
        map(rc => rc[name].asString()),
        distinctUntilChanged()
      )
    });

    this.booleans = new Proxy(allAs('Boolean'), {
      get: (self, name:string) => self[name] || this.all.pipe(
        map(rc => rc[name].asBoolean()),
        distinctUntilChanged()
      )
    });

    this.numbers = new Proxy(allAs('Number'), {
      get: (self, name:string) => self[name] || this.all.pipe(
        map(rc => rc[name].asNumber()),
        distinctUntilChanged()
      )
    });

    return _lazySDKProxy(this, this.remoteConfig, zone);
  }

}
