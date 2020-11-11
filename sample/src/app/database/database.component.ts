import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { EMPTY, Observable } from 'rxjs';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { startWith, tap } from 'rxjs/operators';
import { trace } from '@angular/fire/performance';
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

  constructor(state: TransferState, database: AngularFireDatabase, @Inject(PLATFORM_ID) platformId: object) {
    // TODO fix the Zone.js issue with AngularFireDatabase
    if (isPlatformServer(platformId)) {
      this.testObjectValue$ = EMPTY;
    } else {
      const doc = database.object('test');
      const key = makeStateKey(doc.query.toString());
      const existing = state.get(key, undefined);
      this.testObjectValue$ = doc.valueChanges().pipe(
        trace('database'),
        existing ? startWith(existing) : tap(it => state.set(key, it))
      );
    }
  }

  ngOnInit(): void {
  }

}
