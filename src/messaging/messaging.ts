import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirebaseApp } from 'angularfire2';
import { FirebaseMessaging } from '@firebase/messaging-types';
import { requestPermission } from './observable/request-permission';
import { from } from 'rxjs/observable/from';

@Injectable()
export class AngularFireMessaging {
  messaging: FirebaseMessaging;
  requestPermission: Observable<void>;
  getToken: Observable<string>;
  tokenChanges: Observable<string>;

  constructor(public app: FirebaseApp) {
    this.messaging = app.messaging();

    this.requestPermission = requestPermission(this.messaging);
    this.getToken = from(this.messaging.getToken()!);
    this.tokenChanges = new Observable(subscriber => {
      this.messaging.onTokenRefresh(subscriber);
    });

  }

  deleteToken(token: string) {
    return from(this.messaging.deleteToken(token)!);
  }

}