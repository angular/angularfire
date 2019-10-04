import { Injectable, Inject, Optional, NgZone, InjectionToken } from '@angular/core';
import { Observable, from, concat } from 'rxjs';
import { map, switchMap, tap, take } from 'rxjs/operators';
import { FirebaseAppConfig, FirebaseOptions, FIREBASE_OPTIONS, FIREBASE_APP_NAME } from '@angular/fire';
import { remoteConfig } from 'firebase/app';

// @ts-ignore
import firebase from 'firebase/app';

export interface DefaultConfig {[key:string]: string|number|boolean};

export const REMOTE_CONFIG_SETTINGS = new InjectionToken<remoteConfig.Settings>('angularfire2.remoteConfig.settings');
export const DEFAULT_CONFIG = new InjectionToken<DefaultConfig>('angularfire2.remoteConfig.defaultConfig');

import { FirebaseRemoteConfig, _firebaseAppFactory, runOutsideAngular } from '@angular/fire';

@Injectable()
export class AngularFireRemoteConfig {

  /**
   * Firebase RemoteConfig instance
   */
  public readonly remoteConfig: Observable<FirebaseRemoteConfig>;

  public readonly freshConfiguration: Observable<{[key:string]: remoteConfig.Value}>;

  public readonly configuration: Observable<{[key:string]: remoteConfig.Value}>;

  public readonly activate: Observable<{[key:string]: remoteConfig.Value}>;

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

    this.remoteConfig = requireRemoteConfig.pipe(
      map(rc => rc.registerRemoteConfig(firebase)),
      map(() => _firebaseAppFactory(options, nameOrConfig)),
      map(app => app.remoteConfig()),
      tap(rc => {
        if (settings) { rc.settings = settings }
        if (defaultConfig) { rc.defaultConfig = defaultConfig }
      }),
      runOutsideAngular(zone)
    );

    this.activate = this.remoteConfig.pipe(
      switchMap(rc => rc.activate().then(() => rc)),
      tap(rc => rc.fetch()),
      map(rc => rc.getAll()),
      runOutsideAngular(zone),
      take(1)
    )

    this.freshConfiguration = this.remoteConfig.pipe(
      switchMap(rc => rc.fetchAndActivate().then(() => rc.getAll())),
      runOutsideAngular(zone),
      take(1)
    )

    this.configuration = this.remoteConfig.pipe(
      switchMap(rc => concat(
        rc.activate().then(() => rc.getAll()),
        rc.fetchAndActivate().then(() => rc.getAll())
      )),
      runOutsideAngular(zone)
    )
  }

}
