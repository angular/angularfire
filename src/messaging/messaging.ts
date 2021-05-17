import { FirebaseMessaging } from 'firebase/messaging';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Messaging extends FirebaseMessaging {}

export class Messaging {
  constructor(messaging: FirebaseMessaging) {
    return messaging;
  }
}
