import { Component, makeStateKey, OnInit, TransferState } from '@angular/core';
import { Observable, of } from 'rxjs';

import { AsyncPipe, JsonPipe } from '@angular/common';
import { traceUntilFirst } from '@angular/fire/performance';
import { startWith, switchMap, tap } from 'rxjs/operators';

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
  imports: [AsyncPipe, JsonPipe],
})
export class DatabaseComponent implements OnInit {
  public readonly testObjectValue$: Observable<any>;

  constructor(state: TransferState) {
    const key = makeStateKey<any>('DATABASE');
    const existing = state.get(key, undefined);
    this.testObjectValue$ = of(undefined).pipe(
      switchMap(() => import('./lazyDatabase')),
      switchMap(({ valueChanges }) => valueChanges),
      tap(() => console.log('Before database tracing')),
      (console.log(`Calling traceUntilFirst('database')`),
      <any>traceUntilFirst('database')),
      tap(() => console.log('Database tracing complete')),
      tap((it) => state.set(key, it)),
      existing ? startWith(existing) : tap()
    );
  }

  ngOnInit(): void {}
}
