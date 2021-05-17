import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { trace } from '@angular/fire/performance';
import { AngularFirestoreOffline } from './firestore-offline.module';

@Component({
  selector: 'app-firestore-offline',
  template: `<p>
    Firestore Offline!
    {{ testDocValue$ | async | json }}
    {{ persistenceEnabled$ | async }}
  </p>`,
  styles: [``]
})
export class FirestoreOfflineComponent implements OnInit {

  public readonly persistenceEnabled$: Observable<boolean>;
  public readonly testDocValue$: Observable<any>;

  constructor(state: TransferState, firestore: AngularFirestoreOffline) {
    const doc = firestore.doc('test/1');
    const key = makeStateKey<unknown>(doc.ref.path);
    const existing = state.get(key, undefined);
    this.testDocValue$ = firestore.doc('test/1').valueChanges().pipe(
      trace('firestore'),
      existing ? startWith(existing) : tap(it => state.set(key, it))
    );
    this.persistenceEnabled$ = firestore.persistenceEnabled$;
  }

  ngOnInit(): void {
  }

}
