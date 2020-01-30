import { Injectable, Inject, Optional, NgZone, InjectionToken, PLATFORM_ID } from '@angular/core';
import { of, empty, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { map, tap, shareReplay, switchMap, observeOn } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, ɵAngularFireSchedulers, ɵlazySDKProxy, FIREBASE_OPTIONS, FIREBASE_APP_NAME, ɵfirebaseAppFactory, ɵPromiseProxy } from '@angular/fire';
import { analytics } from 'firebase';

export interface Config {[key:string]: any};

export const COLLECTION_ENABLED = new InjectionToken<boolean>('angularfire2.analytics.analyticsCollectionEnabled');
export const APP_VERSION = new InjectionToken<string>('angularfire2.analytics.appVersion');
export const APP_NAME = new InjectionToken<string>('angularfire2.analytics.appName');
export const DEBUG_MODE = new InjectionToken<boolean>('angularfire2.analytics.debugMode');
export const CONFIG = new InjectionToken<Config>('angularfire2.analytics.config');

const APP_NAME_KEY = 'app_name';
const APP_VERSION_KEY = 'app_version';
const DEBUG_MODE_KEY = 'debug_mode';
const ANALYTICS_ID_FIELD = 'measurementId';
const GTAG_CONFIG_COMMAND = 'config';
const GTAG_FUNCTION_NAME = 'gtag';
const DATA_LAYER_NAME = 'dataLayer';

export interface AngularFireAnalytics extends ɵPromiseProxy<analytics.Analytics> {};

const ANALYTICS_INSTANCE_CACHE = Symbol();
const ANALYTICS_INITIALIZED = Symbol();

@Injectable({
  providedIn: 'any'
})
export class AngularFireAnalytics {

  private gtag: (...args: any[]) => void;

  async updateConfig(config: Config) {
    await global[ANALYTICS_INITIALIZED];
    this.gtag(GTAG_CONFIG_COMMAND, this.options[ANALYTICS_ID_FIELD], { ...config, update: true });
  };

  constructor(
    @Inject(FIREBASE_OPTIONS) private options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(COLLECTION_ENABLED) analyticsCollectionEnabled:boolean|null,
    @Optional() @Inject(APP_VERSION) providedAppVersion:string|null,
    @Optional() @Inject(APP_NAME) providedAppName:string|null,
    @Optional() @Inject(DEBUG_MODE) debugModeEnabled:boolean|null,
    @Optional() @Inject(CONFIG) providedConfig:Config|null,
    @Inject(PLATFORM_ID) platformId:Object,
    zone: NgZone
  ) {

    const schedulers = new ɵAngularFireSchedulers(zone);

    // Analytics errors if it's not unique from a measurementId standpoint, so we need to cache the instances
    if (!global[ANALYTICS_INSTANCE_CACHE]) {
      global[ANALYTICS_INSTANCE_CACHE] = {}
    };

    let analyticsInitialized: Promise<void> = global[ANALYTICS_INITIALIZED];
    let analyticsInstanceCache: {[key:string]: Observable<analytics.Analytics>} = global[ANALYTICS_INSTANCE_CACHE];
    let analytics = analyticsInstanceCache[options[ANALYTICS_ID_FIELD]];

    if (isPlatformBrowser(platformId)) {

      window[DATA_LAYER_NAME] = window[DATA_LAYER_NAME] || [];
      this.gtag = window[GTAG_FUNCTION_NAME] || function() { window[DATA_LAYER_NAME].push(arguments) }

      if (!analyticsInitialized) {
        analyticsInitialized = zone.runOutsideAngular(() =>
          new Promise(resolve => {
            window[GTAG_FUNCTION_NAME] = (...args: any[]) => {
              if (args[0] == 'js') { resolve() }
              this.gtag(...args);
            }
          })
        );
      }

    } else {

      analyticsInitialized = Promise.resolve();
      this.gtag = () => {}

    }

    if (!analytics) {

      analytics = of(undefined).pipe(
        observeOn(schedulers.outsideAngular),
        switchMap(() => isPlatformBrowser(platformId) ? import('firebase/analytics') : empty()),
        map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
        map(app => app.analytics()),
        tap(analytics => {
          if (analyticsCollectionEnabled === false) { analytics.setAnalyticsCollectionEnabled(false) }
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

      analyticsInstanceCache[options[ANALYTICS_ID_FIELD]] = analytics;

    }

    if (providedConfig)     { this.updateConfig(providedConfig) }
    if (providedAppName)    { this.updateConfig({ [APP_NAME_KEY]:    providedAppName }) }
    if (providedAppVersion) { this.updateConfig({ [APP_VERSION_KEY]: providedAppVersion }) }
    if (debugModeEnabled)   { this.updateConfig({ [DEBUG_MODE_KEY]:  1 }) }

    return ɵlazySDKProxy(this, analytics, zone);

  }

}