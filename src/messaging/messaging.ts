import * as firebase from 'firebase/app';
import 'firebase/messaging';
import { Injectable } from '@angular/core';
import { Messaging } from '../interfaces';
import { FirebaseApp } from '../app/index';

@Injectable()
export class AngularFireMessaging {

  /**
   * Firebase Storage instance
   */
  messaging: firebase.messaging.Messaging;

  constructor(public app: FirebaseApp) {
    this.messaging = app.messaging();
  }

}