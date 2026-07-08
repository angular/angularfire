import { AsyncPipe, JsonPipe, SlicePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-messaging',
  template: `
    <p>
      Messaging!
      <code>{{ token$ | async | slice:0:12 }} @if (token$ | async) { &hellip; }</code>
      &nbsp;<code>{{ message$ | async | json }}</code>
      @if (showRequest()) {
        <button (click)="request()">Request FCM token</button>
      }
    </p>
  `,
  imports: [AsyncPipe, SlicePipe, JsonPipe]
})
export class MessagingComponent {

  private readonly messaging = inject(Messaging, { optional: true });
  protected readonly token$ = EMPTY;
  protected readonly message$ = EMPTY;

  protected readonly showRequest = signal(false);

  async request() {
    await Notification.requestPermission();
  }

}
