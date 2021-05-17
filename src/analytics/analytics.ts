import { Analytics as FirebaseAnalytics } from 'firebase/analytics';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Analytics extends FirebaseAnalytics {}

export class Analytics {
  constructor(analytics: FirebaseAnalytics) {
    return analytics;
  }
}
