import { RemoteConfig as FirebaseRemoteConfig } from 'firebase/remote-config';
import { ɵgetAllInstancesOf } from '@angular/fire';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface RemoteConfig extends FirebaseRemoteConfig {}

export class RemoteConfig {
  constructor(remoteConfig: FirebaseRemoteConfig) {
    return remoteConfig;
  }
}

export const REMOTE_CONFIG_PROVIDER_NAME = 'remote-config-exp';

// tslint:disable-next-line:no-empty-interface
export interface RemoteConfigInstances extends Array<FirebaseRemoteConfig> {}

export class RemoteConfigInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseRemoteConfig>(REMOTE_CONFIG_PROVIDER_NAME);
  }
}

export const remoteConfigInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseRemoteConfig>(REMOTE_CONFIG_PROVIDER_NAME))),
  distinct(),
);
