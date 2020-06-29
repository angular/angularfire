import { Component, OnInit } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { trace } from '@angular/fire/performance';
import { Observable, fromEvent } from 'rxjs';
import { tap, map, filter } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import { SwPush } from '@angular/service-worker';

@Component({
  selector: 'app-messaging',
  template: `
    <p>
      Messaging!
      {{ token$ | async | json }}
      {{ message$ | async | json }}
      <button (click)="request()" *ngIf="showRequest">Request FCM token</button>
    </p>
  `,
  styles: []
})
export class MessagingComponent implements OnInit {

  token$: Observable<any>;
  message$: Observable<any>;
  showRequest = false;

  constructor(public readonly messaging: AngularFireMessaging, swPush: SwPush) {
    messaging.usePublicVapidKey('BIDPctnXHQDIjcOXxDS6qQcz-QTws7bL8v7UPgFnS1Ky5BZL3jS3-XXfxwRHmAUMOk7pXme7ttOBvVoIfX57PEo').then(() => {
      this.message$ = messaging.messages;
      this.token$ = messaging.tokenChanges.pipe(
        trace('token'),
        tap(token => this.showRequest = !token)
      );
    });
  }

  ngOnInit(): void {
  }

  request() {
    this.messaging.requestPermission.subscribe(console.log, console.error);
  }

}
