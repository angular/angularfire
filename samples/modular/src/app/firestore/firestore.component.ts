import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { traceUntilFirst } from '@angular/fire/performance';
import { doc, docData, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-firestore',
  template: `<p>
    Firestore!
    {{ testDocValue$ | async | json }}
    {{ persistenceEnabled | async }}
  </p>`,
  styles: [``]
})
export class FirestoreComponent implements OnInit {

  public readonly testDocValue$: Observable<any>;
  public persistenceEnabled: Promise<boolean> = Promise.resolve(false);

  constructor(firestore: Firestore, state: TransferState) {
    const key = makeStateKey<unknown>('FIRESTORE');
    const existing = state.get(key, undefined);
    const ref = doc(firestore, 'test/1');
    this.testDocValue$ = docData(ref).pipe(
      traceUntilFirst('firestore'),
      tap(it => state.set(key, it)),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
  }

}
