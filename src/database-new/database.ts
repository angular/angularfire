import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/database';
import { FirebaseApp } from 'angularfire2';
import { PathReference, DatabaseQuery, DatabaseReference, DatabaseSnapshot, ChildEvent, ListenEvent, SnapshotChange, QueryFn, AngularFireList } from './interfaces';
import * as utils from './utils';
import { Observable } from 'rxjs/Observable';
import { fromRef } from './observable/fromRef';
import { createValueChanges } from './observable/value-changes';
import { createList } from './list/create.list';

@Injectable()
export class AngularFireDatabase {
  database: firebase.database.Database;

  constructor(public app: FirebaseApp) {
    this.database = app.database();
  }

  list<T>(pathOrRef: PathReference, queryFn?: QueryFn): AngularFireList<T> {
    const ref = utils.getRef(this.app, pathOrRef);
    let query: DatabaseQuery = ref;
    if(queryFn) {
      query = queryFn(ref);
    }
    return createList<T>(query);
  }

  object<T>(pathOrRef: PathReference) {

  }

}

