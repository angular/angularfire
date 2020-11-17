import { Inject, Injectable, InjectionToken, NgZone, Optional, PLATFORM_ID } from '@angular/core';
import { EMPTY, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { map, shareReplay, switchMap, observeOn } from 'rxjs/operators';
import {
  ɵAngularFireSchedulers,
  ɵlazySDKProxy,
  ɵPromiseProxy,
  ɵapplyMixins,
  FirebaseApp
} from '@angular/fire';
import firebase from 'firebase/app';
import { proxyPolyfillCompat } from './base';
import { ɵfetchInstance } from '@angular/fire';

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

@Injectable({
  providedIn: 'any'
})
export class AngularFireAnalytics {

  private measurementId: string;
  private analyticsInitialized: Promise<void> = new Promise(() => {});

  async updateConfig(config: Config) {
    await this.analyticsInitialized;
    window[GTAG_FUNCTION_NAME](GTAG_CONFIG_COMMAND, this.measurementId, { ...config, update: true });
  }

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
          this.measurementId = args[1];
          return true;
        } else {
          return false;
        }
      };

      const patchGtag = (fn?: (...args: any[]) => void) => {
        window[GTAG_FUNCTION_NAME] = (...args: any[]) => {
          if (fn) {
            fn(args);
          }
          // Inject app_name and app_version into events
          // TODO(jamesdaniels): I'm doing this as documented but it's still not
          //   showing up in the console. Investigate. Guessing it's just part of the
          //   whole GA4 transition mess.
          // TODO check the send_to to make sure we're only sending to the firebase
          //   property, incase they have multple gtags
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
      };

      // Unclear if we still need to but I was running into config/events I passed
      // to gtag before ['js' timestamp] weren't getting parsed, so let's make a promise
      // that resolves when firebase/analytics has configured gtag.js that we wait on
      // before sending anything
      const firebaseAnalyticsAlreadyInitialized = window[DATA_LAYER_NAME].some(parseMeasurementId);
      if (firebaseAnalyticsAlreadyInitialized) {
        this.analyticsInitialized = Promise.resolve();
        patchGtag();
      } else {
        this.analyticsInitialized = new Promise(resolve => {
          patchGtag((...args) => {
            if (parseMeasurementId(...args)) {
              resolve();
            }
          });
        });
      }

      if (providedConfig) {
        this.updateConfig(providedConfig);
      }
      if (debugModeEnabled) {
        this.updateConfig({ [DEBUG_MODE_KEY]: 1 });
      }

    } else {

      this.analyticsInitialized = Promise.reject();

    }

    const analytics = of(undefined).pipe(
      observeOn(new ɵAngularFireSchedulers(zone).outsideAngular),
      switchMap(() => import('firebase/analytics')),
      switchMap(() => firebase.analytics.isSupported().then(it => it, () => false)),
      // TODO server-side investigate use of the Universal Analytics API
      switchMap(supported => supported ? of(undefined) : EMPTY),
      map(() => {
        return ɵfetchInstance(`analytics`, 'AngularFireAnalytics', app, () => {
          const analytics = app.analytics();
          if (analyticsCollectionEnabled === false) {
            analytics.setAnalyticsCollectionEnabled(false);
          }
          return analytics;
        }, [app, analyticsCollectionEnabled, providedConfig, debugModeEnabled]);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return ɵlazySDKProxy(this, analytics, zone);

  }

}

ɵapplyMixins(AngularFireAnalytics, [proxyPolyfillCompat]);
