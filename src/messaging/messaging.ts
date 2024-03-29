import { ɵgetAllInstancesOf } from '@angular/fire';
import { Messaging as FirebaseMessaging } from 'firebase/messaging';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Messaging extends FirebaseMessaging {}

export class Messaging {
  constructor(messaging: FirebaseMessaging) {
    return messaging;
  }
}

export const MESSAGING_PROVIDER_NAME = 'messaging';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MessagingInstances extends Array<FirebaseMessaging> {}

export class MessagingInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME);
  }
}

export const messagingInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME))),
  distinct(),
);
