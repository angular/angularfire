import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { traceUntilFirst } from '@angular/fire/performance';

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

  constructor(state: TransferState) {
    const key = makeStateKey<unknown>('FIRESTORE');
    const existing = state.get(key, undefined);
    this.testDocValue$ = of(existing).pipe(
      switchMap(() => import('./lazyFirestore')),
      tap(({ persistenceEnabled }) => this.persistenceEnabled = persistenceEnabled),
      switchMap(({ valueChanges }) => valueChanges),
      traceUntilFirst('firestore'),
      tap(it => state.set(key, it)),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
  }

}
