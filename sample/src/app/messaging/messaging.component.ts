import { Component, OnInit, Optional } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { EMPTY, from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

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

  token$: Observable<any> = EMPTY;
  message$: Observable<any> = EMPTY;
  showRequest = false;

  constructor(@Optional() private messaging: Messaging) {
    if (messaging) {
      this.token$ = from(
        navigator.serviceWorker.register('firebase-messaging-sw.js', { type: 'module' }).
          then(serviceWorkerRegistration => {
            return getToken(messaging, {
              serviceWorkerRegistration,
              vapidKey: environment.vapidKey,
            });
          }));
      this.message$ = new Observable(sub => onMessage(messaging, it => sub.next(it)));
    }
  }

  ngOnInit(): void {
  }

  request() {
    Notification.requestPermission();
  }

}
