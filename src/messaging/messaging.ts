import { FirebaseMessaging } from 'firebase/messaging';
import { ɵgetAllInstancesOf } from '../core';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Messaging extends FirebaseMessaging {}

export class Messaging {
  constructor(messaging: FirebaseMessaging) {
    return messaging;
  }
}

export const MESSAGING_PROVIDER_NAME = 'messaging-exp';

// tslint:disable-next-line:no-empty-interface
export interface MessagingInstances extends Array<FirebaseMessaging> {}

export class MessagingInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseMessaging>(MESSAGING_PROVIDER_NAME);
  }
}
