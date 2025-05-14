import { ɵgetAllInstancesOf } from '@angular/fire';
import { AI as FirebaseAI } from 'firebase/ai';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AI extends FirebaseAI {}

export class AI {
  constructor(ai: FirebaseAI) {
    return ai;
  }
}

export const AI_PROVIDER_NAME = 'ai';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AIInstances extends Array<FirebaseAI> {}

export class AIInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseAI>(AI_PROVIDER_NAME);
  }
}

export const AIInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseAI>(AI_PROVIDER_NAME))),
  distinct(),
);
