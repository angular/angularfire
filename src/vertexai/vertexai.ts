import { ɵgetAllInstancesOf } from '@angular/fire';
import { VertexAI as FirebaseVertexAI } from 'firebase/vertexai';
import { from, timer } from 'rxjs';
import { concatMap, distinct } from 'rxjs/operators';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VertexAI extends FirebaseVertexAI {}

export class VertexAI {
  constructor(vertexai: FirebaseVertexAI) {
    return vertexai;
  }
}

export const VERTEX_AI_PROVIDER_NAME = 'vertexai';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface VertexAIInstances extends Array<FirebaseVertexAI> {}

export class VertexAIInstances {
  constructor() {
    return ɵgetAllInstancesOf<FirebaseVertexAI>(VERTEX_AI_PROVIDER_NAME);
  }
}

export const vertexAIInstance$ = timer(0, 300).pipe(
  concatMap(() => from(ɵgetAllInstancesOf<FirebaseVertexAI>(VERTEX_AI_PROVIDER_NAME))),
  distinct(),
);
