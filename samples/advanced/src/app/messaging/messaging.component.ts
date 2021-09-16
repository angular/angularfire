import { Component, OnInit, Optional } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { EMPTY, from, Observable } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-messaging',
  template: `
    <p>
      Messaging!
      <code>{{ token$ | async | slice:0:12 }}<ng-container *ngIf="(token$ | async) !== null">&hellip;</ng-container></code>
      &nbsp;<code>{{ message$ | async | json }}</code>
      <button (click)="request()" *ngIf="showRequest">Request FCM token</button>
    </p>
  `,
  styles: []
})
export class MessagingComponent implements OnInit {

  token$: Observable<any> = EMPTY;
  message$: Observable<any> = EMPTY;
  showRequest = false;

  constructor(messaging: Messaging) {
    if (messaging) {
      this.token$ = from(
        navigator.serviceWorker.register('firebase-messaging-sw.js', { type: 'module', scope: '__' }).
          then(serviceWorkerRegistration =>
            getToken(messaging, {
              serviceWorkerRegistration,
              vapidKey: environment.vapidKey,
            })
          )).pipe(
            tap(token => console.log('FCM', {token})),
            share()
          );
      this.message$ = new Observable(sub => onMessage(messaging, it => sub.next(it))).pipe(
        tap(it => console.log('FCM', it)),
      );
    }
  }

  ngOnInit(): void {
  }

  request() {
    Notification.requestPermission();
  }

}
