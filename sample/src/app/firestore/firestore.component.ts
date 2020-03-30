import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { tap, startWith } from 'rxjs/operators';
import { TransferState, makeStateKey } from '@angular/platform-browser';

@Component({
  selector: 'app-firestore',
  template: `<p>
    Firestore!
    {{ testDocValue$ | async | json }}
    {{ persistenceEnabled$ | async }}
  </p>`,
  styles: [``]
})
export class FirestoreComponent implements OnInit {

  public readonly persistenceEnabled$: Observable<boolean>;
  public readonly testDocValue$: Observable<any>;

  constructor(state: TransferState, firestore: AngularFirestore) {
    const doc = firestore.doc('test/1');
    const key = makeStateKey(doc.ref.path);
    const existing = state.get(key, undefined);
    this.testDocValue$ = firestore.doc('test/1').valueChanges().pipe(existing ? startWith(existing) : tap(it => state.set(key, it)));
    this.persistenceEnabled$ = firestore.persistenceEnabled$;
  }

  ngOnInit(): void {
  }

}
