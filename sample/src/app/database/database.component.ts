import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { startWith, switchMap, tap } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';

@Component({
  selector: 'app-database',
  template: `
    <p>
      Database!
      {{ testObjectValue$ | async | json }}
    </p>
  `,
  styles: []
})
export class DatabaseComponent implements OnInit {

  public readonly testObjectValue$: Observable<any>;

  constructor(state: TransferState) {
    const key = makeStateKey<any>('DATABASE');
    const existing = state.get(key, undefined);
    this.testObjectValue$ = of(undefined).pipe(
      switchMap(() => import('./lazyDatabase').then(({ valueChanges }) => valueChanges)),
      switchMap(it => it),
      traceUntilFirst('database'),
      tap(it => state.set(key, it)),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
  }

}
