import { Component, OnInit } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { trace } from '@angular/fire/compat/performance';
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
  }

  ngOnInit(): void {
  }

  request() {
    this.messaging.requestPermission.subscribe(console.log, console.error);
  }

}
