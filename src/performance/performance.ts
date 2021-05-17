import { FirebasePerformance } from 'firebase/performance';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Performance extends FirebasePerformance {}

export class Performance {
  constructor(performance: FirebasePerformance) {
    return performance;
  }
}
