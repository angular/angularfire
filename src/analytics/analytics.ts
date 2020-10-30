import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { map, tap, shareReplay, switchMap, observeOn } from 'rxjs/operators';
import {
  FirebaseAppConfig,
  FirebaseOptions,
  ɵAngularFireSchedulers,
  ɵlazySDKProxy,
  FIREBASE_OPTIONS,
  FIREBASE_APP_NAME,
  ɵfirebaseAppFactory,
  ɵPromiseProxy
} from '@angular/fire';
import firebase from 'firebase/app';

export interface Config {
  [key: string]: any;
}

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

export interface AngularFireAnalytics extends ɵPromiseProxy<firebase.analytics.Analytics> {
}

let gtag: (...args: any[]) => void;
let analyticsInitialized: Promise<void>;
const analyticsInstanceCache: { [key: string]: Observable<firebase.analytics.Analytics> } = {};

@Injectable({
  providedIn: 'any'
})
export class AngularFireAnalytics {

  async updateConfig(config: Config) {
    await analyticsInitialized;
    gtag(GTAG_CONFIG_COMMAND, this.options[ANALYTICS_ID_FIELD], { ...config, update: true });
  }

  constructor(
    @Inject(FIREBASE_OPTIONS) private options: FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig: string | FirebaseAppConfig | null | undefined,
    @Optional() @Inject(COLLECTION_ENABLED) analyticsCollectionEnabled: boolean | null,
    @Optional() @Inject(APP_VERSION) providedAppVersion: string | null,
    @Optional() @Inject(APP_NAME) providedAppName: string | null,
    @Optional() @Inject(DEBUG_MODE) debugModeEnabled: boolean | null,
    @Optional() @Inject(CONFIG) providedConfig: Config | null,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {

    if (!analyticsInitialized) {
      if (isPlatformBrowser(platformId)) {
        window[DATA_LAYER_NAME] = window[DATA_LAYER_NAME] || [];
        /**
         * According to the gtag documentation, this function that defines a custom data layer cannot be
         * an arrow function because 'arguments' is not an array. It is actually an object that behaves
         * like an array and contains more information then just indexes. Transforming this into arrow function
         * caused issue #2505 where analytics no longer sent any data.
         */
        // tslint:disable-next-line: only-arrow-functions
        gtag = (window[GTAG_FUNCTION_NAME] as any) || (function(..._args: any[]) {
          (window[DATA_LAYER_NAME] as any).push(arguments);
        });
        analyticsInitialized = zone.runOutsideAngular(() =>
          new Promise(resolve => {
            window[GTAG_FUNCTION_NAME] = (...args: any[]) => {
              if (args[0] === 'js') {
                resolve();
              }
              gtag(...args);
            };
          })
        );
      } else {
        gtag = () => {
        };
        analyticsInitialized = Promise.resolve();
      }
    }

    let analytics = analyticsInstanceCache[options[ANALYTICS_ID_FIELD]];
    if (!analytics) {
      analytics = of(undefined).pipe(
        observeOn(new ɵAngularFireSchedulers(zone).outsideAngular),
        switchMap(() => isPlatformBrowser(platformId) ? import('firebase/analytics') : EMPTY),
        map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
        map(app => app.analytics()),
        tap(analytics => {
          if (analyticsCollectionEnabled === false) {
            analytics.setAnalyticsCollectionEnabled(false);
          }
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      analyticsInstanceCache[options[ANALYTICS_ID_FIELD]] = analytics;
    }

    if (providedConfig) {
      this.updateConfig(providedConfig);
    }
    if (providedAppName) {
      this.updateConfig({ [APP_NAME_KEY]: providedAppName });
    }
    if (providedAppVersion) {
      this.updateConfig({ [APP_VERSION_KEY]: providedAppVersion });
    }
    if (debugModeEnabled) {
      this.updateConfig({ [DEBUG_MODE_KEY]: 1 });
    }

    return ɵlazySDKProxy(this, analytics, zone);

  }

}
