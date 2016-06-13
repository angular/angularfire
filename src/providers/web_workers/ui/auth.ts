import {Injectable, Inject} from '@angular/core';
import {ServiceMessageBrokerFactory, PRIMITIVE} from '@angular/platform-browser/src/worker_render';
import {AUTH_CHANNEL, INITIAL_AUTH_CHANNEL} from '../shared/channels';
import {FirebaseAuthState} from '../../auth_backend';
import {FirebaseSdkAuthBackend} from '../../firebase_sdk_auth_backend';

@Injectable()
export class MessageBasedFirebaseAuth {
  constructor(private _sdkBackend: FirebaseSdkAuthBackend,
              private _brokerFactory: ServiceMessageBrokerFactory) {
  }

  start(): void {
    let broker = this._brokerFactory.createMessageBroker(AUTH_CHANNEL);
    broker.registerMethod('authAnonymously', [PRIMITIVE], this._sdkBackend.authAnonymously.bind(this._sdkBackend),
                          PRIMITIVE);
    broker.registerMethod('authWithPassword', [PRIMITIVE, PRIMITIVE],
                          this._sdkBackend.authWithPassword.bind(this._sdkBackend), PRIMITIVE);
    broker.registerMethod('authWithOAuthPopup', [PRIMITIVE, PRIMITIVE],
                          this._sdkBackend.authWithOAuthPopup.bind(this._sdkBackend), PRIMITIVE);
    broker.registerMethod('authWithOAuthRedirect', [PRIMITIVE, PRIMITIVE],
                          this._sdkBackend.authWithOAuthRedirect.bind(this._sdkBackend), PRIMITIVE);
    broker.registerMethod('authWithOAuthToken', [PRIMITIVE, PRIMITIVE, PRIMITIVE],
                          this._sdkBackend.authWithOAuthToken.bind(this._sdkBackend), PRIMITIVE);
    broker.registerMethod('getAuth', null, this._getAuth.bind(this), PRIMITIVE);
    broker.registerMethod('unauth', null, this._sdkBackend.unauth.bind(this._sdkBackend));
  }

  private _getAuth(): Promise<FirebaseAuthData> {
    return new Promise((res, rej) => {
      res(this._sdkBackend.getAuth());
    });
  }
}
