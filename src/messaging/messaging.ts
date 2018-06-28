import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirebaseApp } from 'angularfire2';
import { messaging } from 'firebase';
import { requestPermission } from './observable/request-permission';
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable()
export class AngularFireMessaging {
  messaging: messaging.Messaging;
  requestPermission: Observable<void>;
  getToken: Observable<string|null>;
  tokenChanges: Observable<string|null>;
  messages: Observable<{}>;
  requestToken: Observable<string|null>;

  constructor(public app: FirebaseApp) {
    this.messaging = app.messaging();

    this.requestPermission = requestPermission(this.messaging);

    this.getToken = from(this.messaging.getToken());

    this.tokenChanges = new Observable(subscriber => {
      this.messaging.getToken().then(t => subscriber.next(t));
      this.messaging.onTokenRefresh(subscriber);
    });

    this.messages = new Observable(subscriber => {
      this.messaging.onMessage(subscriber);
    });
    
    this.requestToken = this.requestPermission.pipe(
      mergeMap(() => this.tokenChanges)
    );

  }

  deleteToken(token: string) {
    return from(this.messaging.deleteToken(token)!);
  }

}