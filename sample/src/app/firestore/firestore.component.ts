import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '../../firestore';
import { Observable } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { trace } from '@angular/fire/performance';

@Component({
  selector: 'app-firestore',
  template: `<p>
    Firestore!
    {{ testDocValue$ | async | json }}
  </p>`,
  styles: [``]
})
export class FirestoreComponent implements OnInit {

  public readonly testDocValue$: Observable<any>;

  constructor(state: TransferState, firestore: AngularFirestore) {
    const doc = firestore.doc('test/1');
    const key = makeStateKey('test/1');
    const existing = state.get(key, undefined);
    this.testDocValue$ = doc.valueChanges().pipe(
      trace('firestore'),
      existing ? startWith(existing) : tap(it => state.set(key, it))
    );
  }

  ngOnInit(): void {
  }

}
