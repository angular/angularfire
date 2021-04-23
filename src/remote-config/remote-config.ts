import { RemoteConfig as FirebaseRemoteConfig } from 'firebase/remote-config';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface RemoteConfig extends FirebaseRemoteConfig {}

export class RemoteConfig {
  constructor(remoteConfig: FirebaseRemoteConfig) {
    return remoteConfig;
  }
}
