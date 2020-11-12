import { Component, OnInit } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { trace } from '@angular/fire/performance';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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

  constructor(public readonly messaging: AngularFireMessaging) {
    this.message$ = messaging.messages;
    this.token$ = messaging.tokenChanges.pipe(
      trace('token'),
      tap(token => this.showRequest = !token)
    );
    /*
    TODO get this sorted back out with Firebase 8
    messaging.usePublicVapidKey(environment.vapidKey).then(async () => {
      if (navigator && navigator.serviceWorker) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await messaging.useServiceWorker(registration);
        }
      }
    });*/
  }

  ngOnInit(): void {
  }

  request() {
    this.messaging.requestPermission.subscribe(console.log, console.error);
  }

}
