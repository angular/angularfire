import { FirebaseDatabase } from 'firebase/database';

// see notes in core/firebase.app.module.ts for why we're building the class like this
// tslint:disable-next-line:no-empty-interface
export interface Database extends FirebaseDatabase {}

export class Database {
  constructor(database: FirebaseDatabase) {
    return database;
  }
}
