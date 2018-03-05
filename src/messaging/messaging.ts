import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirebaseApp } from 'angularfire2';
import { FirebaseMessaging } from '@firebase/messaging-types';
import { requestPermission } from './observable/request-permission';

@Injectable()
export class AngularFireMessaging {
  messaging: FirebaseMessaging;
  requestPermission: Observable<void>;

  constructor(public app: FirebaseApp) {
    this.messaging = app.messaging();

    this.requestPermission = requestPermission(this.messaging);
  }

}