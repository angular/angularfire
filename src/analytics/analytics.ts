import { Injectable, Inject, Optional, NgZone, InjectionToken, PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { map, tap, shareReplay, switchMap } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, runOutsideAngular, ɵlazySDKProxy, FirebaseAnalytics, FIREBASE_OPTIONS, FIREBASE_APP_NAME, _firebaseAppFactory } from '@angular/fire';
import { analytics, app } from 'firebase';

export const ANALYTICS_COLLECTION_ENABLED = new InjectionToken<boolean>('angularfire2.analytics.analyticsCollectionEnabled');

export const APP_VERSION = new InjectionToken<string>('angularfire2.analytics.appVersion');
export const APP_NAME = new InjectionToken<string>('angularfire2.analytics.appName');
export const DEBUG_MODE = new InjectionToken<boolean>('angularfire2.analytics.debugMode');

const APP_NAME_KEY = 'app_name';
const APP_VERSION_KEY = 'app_version';
const DEBUG_MODE_KEY = 'debug_mode';
const ANALYTICS_ID_FIELD = 'measurementId';
const GTAG_CONFIG_COMMAND = 'config';
const GTAG_FUNCTION_NAME = 'gtag';
const DATA_LAYER_NAME = 'dataLayer';

// SEMVER: once we move to Typescript 3.6 use `PromiseProxy<analytics.Analytics>`
type AnalyticsProxy = {
  // TODO can we pull the richer types from the Firebase SDK .d.ts? ReturnType<T[K]> is infering
  //      I could even do this in a manual build-step
  logEvent(eventName: string, eventParams?: {[key: string]: any}, options?: analytics.AnalyticsCallOptions): Promise<void>,
  setCurrentScreen(screenName: string, options?: analytics.AnalyticsCallOptions): Promise<void>,
  setUserId(id: string, options?: analytics.AnalyticsCallOptions): Promise<void>,
  setUserProperties(properties: analytics.CustomParams, options?: analytics.AnalyticsCallOptions): Promise<void>,
  setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>,
  app: Promise<app.App>
};

export interface AngularFireAnalytics extends AnalyticsProxy {};

@Injectable()
export class AngularFireAnalytics {

  private gtag: (...args: any[]) => void;
  private analyticsInitialized: Promise<void>;

  async updateConfig(config: {[key:string]: any}) {
    await this.analyticsInitialized;
    this.gtag(GTAG_CONFIG_COMMAND, this.options[ANALYTICS_ID_FIELD], { ...config, update: true });
  };

  constructor(
    @Inject(FIREBASE_OPTIONS) private options:FirebaseOptions,
    @Optional() @Inject(FIREBASE_APP_NAME) nameOrConfig:string|FirebaseAppConfig|null|undefined,
    @Optional() @Inject(ANALYTICS_COLLECTION_ENABLED) analyticsCollectionEnabled:boolean|null,
    @Optional() @Inject(APP_VERSION) providedAppVersion:string|null,
    @Optional() @Inject(APP_NAME) providedAppName:string|null,
    @Optional() @Inject(DEBUG_MODE) debugModeEnabled:boolean|null,
    @Inject(PLATFORM_ID) platformId:Object,
    zone: NgZone
  ) {

    if (isPlatformBrowser(platformId)) {

      window[DATA_LAYER_NAME] = window[DATA_LAYER_NAME] || [];
      this.gtag = window[GTAG_FUNCTION_NAME] || function() { window[DATA_LAYER_NAME].push(arguments) }
      this.analyticsInitialized = zone.runOutsideAngular(() =>
        new Promise(resolve => {
          window[GTAG_FUNCTION_NAME] = (...args: any[]) => {
            if (args[0] == 'js') { resolve() }
            this.gtag(...args);
          }
        })
      );

    } else {

      this.analyticsInitialized = Promise.resolve();
      this.gtag = () => {}

    }

    if (providedAppName)    { this.updateConfig({ [APP_NAME_KEY]:    providedAppName }) }
    if (providedAppVersion) { this.updateConfig({ [APP_VERSION_KEY]: providedAppVersion }) }
    if (debugModeEnabled)   { this.updateConfig({ [DEBUG_MODE_KEY]:  1 }) }

    const analytics = of(undefined).pipe(
      // @ts-ignore zapping in the UMD in the build script
      switchMap(() => zone.runOutsideAngular(() => import('firebase/analytics'))),
      map(() => _firebaseAppFactory(options, zone, nameOrConfig)),
      // SEMVER no need to cast once we drop older Firebase
      map(app => <analytics.Analytics>app.analytics()),
      tap(analytics => {
        if (analyticsCollectionEnabled === false) { analytics.setAnalyticsCollectionEnabled(false) }
      }),
      runOutsideAngular(zone),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return ɵlazySDKProxy(this, analytics, zone);
    
  }

}