import { Component, OnInit } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { traceUntilFirst } from '@angular/fire/performance';

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

  constructor(state: TransferState, firestore: Firestore) {
    const ref = doc(firestore, 'test/1');
    const key = makeStateKey<unknown>(ref.path);
    const existing = state.get(key, undefined);
    this.testDocValue$ = docData(ref).pipe(
      traceUntilFirst('firestore'),
      existing ? startWith(existing) : tap(it => state.set(key, it))
    );
  }

  ngOnInit(): void {
  }

}
