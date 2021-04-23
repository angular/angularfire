import { Functions as FirebaseFunctions } from 'firebase/functions';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Functions extends FirebaseFunctions {}

export class Functions {
  constructor(functions: FirebaseFunctions) {
    return functions;
  }
}
