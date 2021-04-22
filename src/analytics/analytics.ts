import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ɵfetchInstance, FirebaseApp } from '@angular/fire';
import { getAnalytics, Analytics, setAnalyticsCollectionEnabled } from 'firebase/analytics';

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
const SEND_TO_KEY = 'send_to';

// tslint:disable-next-line:no-empty-interface
export interface AngularFireAnalytics extends Analytics {}

let resolveAnalyticsInitialized: () => void | undefined;
const measurementId: () => string = () => globalThis.ɵAngularfireMeasurementId;
const analyticsInitialized: Promise<void> = globalThis.ɵAngularfireAnalyticsInitialized || new Promise((resolve) => {
  resolveAnalyticsInitialized = resolve;
});

globalThis.ɵAngularfireAnalyticsInitialized ||= analyticsInitialized;

@Injectable({
  providedIn: 'any'
})
export class AngularFireAnalytics {

  constructor(
    app: FirebaseApp,
    @Optional() @Inject(COLLECTION_ENABLED) analyticsCollectionEnabled: boolean | null,
    @Optional() @Inject(APP_VERSION) providedAppVersion: string | null,
    @Optional() @Inject(APP_NAME) providedAppName: string | null,
    @Optional() @Inject(DEBUG_MODE) debugModeEnabled: boolean | null,
    @Optional() @Inject(CONFIG) providedConfig: Config | null,
    // tslint:disable-next-line:ban-types
    @Inject(PLATFORM_ID) platformId: Object,
    zone: NgZone
  ) {

    if (isPlatformBrowser(platformId)) {

      window[DATA_LAYER_NAME] = window[DATA_LAYER_NAME] || [];

      // It turns out we can't rely on the measurementId in the Firebase config JSON
      // this identifier is not stable. firebase/analytics does a call to get a fresh value
      // falling back on the one in the config. Rather than do that ourselves we should listen
      // on our gtag function for a analytics config command
      // e.g, ['config', measurementId, { origin: 'firebase', firebase_id }]
      const parseMeasurementId = (...args: any[]) => {
        if (args[0] === 'config' && args[2].origin === 'firebase') {
          globalThis.ɵAngularfireMeasurementId = args[1];
          return true;
        } else {
          return false;
        }
      };

      const patchGtag = (fn?: (...args: any[]) => void) => {
        window[GTAG_FUNCTION_NAME] = (...args: any[]) => {
          if (fn) {
            fn(...args);
          }
          // Inject app_name and app_version into events
          // TODO(jamesdaniels): I'm doing this as documented but it's still not
          //   showing up in the console. Investigate. Guessing it's just part of the
          //   whole GA4 transition mess.
          if (args[0] === 'event' && args[2][SEND_TO_KEY] === measurementId()) {
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
      };

      // Unclear if we still need to but I was running into config/events I passed
      // to gtag before ['js' timestamp] weren't getting parsed, so let's make a promise
      // that resolves when firebase/analytics has configured gtag.js that we wait on
      // before sending anything
      const firebaseAnalyticsAlreadyInitialized = window[DATA_LAYER_NAME].some(parseMeasurementId);
      if (firebaseAnalyticsAlreadyInitialized) {
        if (resolveAnalyticsInitialized) { resolveAnalyticsInitialized(); }
        patchGtag();
      } else {
        patchGtag((...args) => {
          if (parseMeasurementId(...args)) {
            if (resolveAnalyticsInitialized) { resolveAnalyticsInitialized(); }
          }
        });
      }

      if (providedConfig) {
        updateConfig(providedConfig);
      }
      if (debugModeEnabled) {
        updateConfig({ [DEBUG_MODE_KEY]: 1 });
      }

    }

    return zone.runOutsideAngular(() =>
      ɵfetchInstance(`analytics`, 'AngularFireAnalytics', app.name, () => {
          const analytics = getAnalytics(app);
          if (analyticsCollectionEnabled === false) {
            setAnalyticsCollectionEnabled(analytics, false);
          }
          return analytics;
      }, [app, analyticsCollectionEnabled, providedConfig, debugModeEnabled])
    );
  }
}


export async function updateConfig(config: Config) {
  await this.analyticsInitialized;
  window[GTAG_FUNCTION_NAME](GTAG_CONFIG_COMMAND, measurementId(), { ...config, update: true });
}
