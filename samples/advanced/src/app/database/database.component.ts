import { Component, OnInit, makeStateKey, TransferState } from '@angular/core';
import { Observable, of } from 'rxjs';

import { startWith, switchMap, tap } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
    selector: 'app-database',
    template: `
    <p>
      Database!
      <code>{{ testObjectValue$ | async | json }}</code>
    </p>
  `,
    styles: [],
    standalone: true,
    imports: [AsyncPipe, JsonPipe]
})
export class DatabaseComponent implements OnInit {

  public readonly testObjectValue$: Observable<any>;

  constructor(state: TransferState) {
    const key = makeStateKey<any>('DATABASE');
    const existing = state.get(key, undefined);
    this.testObjectValue$ = of(undefined).pipe(
      switchMap(() => import('./lazyDatabase')),
      switchMap(({valueChanges}) => valueChanges),
      <any>traceUntilFirst('database'),
      tap(it => state.set(key, it)),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
  }

}
