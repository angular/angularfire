import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { startWith, tap } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';
import { Database, objectVal, ref } from '@angular/fire/database';

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

  constructor(database: Database, state: TransferState) {
    const key = makeStateKey<any>('DATABASE');
    const existing = state.get(key, undefined);
    const doc = ref(database, 'test');
    this.testObjectValue$ = objectVal(doc).pipe(
      traceUntilFirst('database'),
      tap(it => state.set(key, it)),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
  }

}
