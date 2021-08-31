import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Database, ref, objectVal } from '@angular/fire/database';
import { EMPTY, Observable } from 'rxjs';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { startWith, tap } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';
import { isPlatformServer } from '@angular/common';

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

  constructor(state: TransferState, database: Database, @Inject(PLATFORM_ID) platformId: object) {
    if (isPlatformServer(platformId)) {
      this.testObjectValue$ = EMPTY;
    } else {
      const doc = ref(database, 'test');
      const key = makeStateKey<unknown>(doc.ref.toString());
      const existing = state.get(key, undefined);
      this.testObjectValue$ = objectVal(doc).pipe(
        traceUntilFirst('database'),
        existing ? startWith(existing) : tap(it => state.set(key, it))
      );
    }
  }

  ngOnInit(): void {
  }

}
