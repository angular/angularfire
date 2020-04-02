import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { startWith, tap } from 'rxjs/operators';
import { trace } from '@angular/fire/performance';

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

  constructor(state: TransferState, database: AngularFireDatabase) {
    const doc = database.object('test');
    const key = makeStateKey(doc.query.toString());
    const existing = state.get(key, undefined);
    this.testObjectValue$ = doc.valueChanges().pipe(
      trace('database'),
      existing ? startWith(existing) : tap(it => state.set(key, it))
    );
  }

  ngOnInit(): void {
  }

}
