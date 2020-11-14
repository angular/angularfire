import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { EMPTY, of } from 'rxjs';
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
  ɵPromiseProxy,
  ɵapplyMixins
} from '@angular/fire';
import firebase from 'firebase/app';
import { proxyPolyfillCompat } from './base';

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
const GTAG_CONFIG_COMMAND = 'config';
const GTAG_FUNCTION_NAME = 'gtag'; // TODO rename these
const DATA_LAYER_NAME = 'dataLayer';

export interface AngularFireAnalytics extends ɵPromiseProxy<firebase.analytics.Analytics> {
}

let gtag: (...args: any[]) => void;

// tslint:disable-next-line
var __analyticsInitialized: Promise<void>;

@Injectable({
  providedIn: 'any'
})
export class AngularFireAnalytics {

  private measurementId: string;

  async updateConfig(config: Config) {
    await __analyticsInitialized;
    window[GTAG_FUNCTION_NAME](GTAG_CONFIG_COMMAND, this.measurementId, { ...config, update: true });
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

    if (!__analyticsInitialized) {
      if (isPlatformBrowser(platformId)) {
        window[DATA_LAYER_NAME] = window[DATA_LAYER_NAME] || [];

        __analyticsInitialized = new Promise(resolve => {
          window[GTAG_FUNCTION_NAME] = (...args: any[]) => {
            // wait to initialize until we know the measurementId as the one in config is unstable
            if (args[0] === 'config' && args[2].origin === 'firebase') {
              this.measurementId = args[1];
              resolve();
            }
            if (args[0] === 'event') {
              if (providedAppName) {
                args[2][APP_NAME_KEY] = providedAppName;
              }
              if (providedAppVersion) {
                args[2][APP_VERSION_KEY] = providedAppVersion;
              }
            }
            if (debugModeEnabled && typeof console !== 'undefined') {
              // tslint:disable-next-line:no-console
              console.info(...args);
            }
            /**
             * According to the gtag documentation, this function that defines a custom data layer cannot be
             * an arrow function because 'arguments' is not an array. It is actually an object that behaves
             * like an array and contains more information then just indexes. Transforming this into arrow function
             * caused issue #2505 where analytics no longer sent any data.
             */
            // tslint:disable-next-line: only-arrow-functions
            (function(..._args: any[]) {
              window[DATA_LAYER_NAME].push(arguments);
            })(...args);
          };
        });
      } else {
        gtag = () => {};
        __analyticsInitialized = Promise.resolve();
      }
    }

    const analytics = of(undefined).pipe(
      observeOn(new ɵAngularFireSchedulers(zone).outsideAngular),
      switchMap(() => isPlatformBrowser(platformId) ? import('firebase/analytics') : EMPTY),
      map(() => ɵfirebaseAppFactory(options, zone, nameOrConfig)),
      // app.analytics doesn't expose settings, which is odd... bug?
      /* tap((app: any) => app.analytics.settings({
        dataLayerName: DATA_LAYER_NAME,
        gtagName: GTAG_FUNCTION_NAME,
      })), */
      map(app => app.analytics()),
      tap(analytics => {
        if (analyticsCollectionEnabled === false) {
          analytics.setAnalyticsCollectionEnabled(false);
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    if (providedConfig) {
      this.updateConfig(providedConfig);
    }
    if (debugModeEnabled) {
      this.updateConfig({ [DEBUG_MODE_KEY]: 1 });
    }

    return ɵlazySDKProxy(this, analytics, zone);

  }

}

ɵapplyMixins(AngularFireAnalytics, [proxyPolyfillCompat]);
