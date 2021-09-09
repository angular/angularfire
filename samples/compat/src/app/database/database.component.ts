import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { EMPTY, Observable } from 'rxjs';
import { trace } from '@angular/fire/compat/performance';

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

  constructor(database: AngularFireDatabase) {
    const doc = database.object('test');
    this.testObjectValue$ = doc.valueChanges().pipe(
      trace('database'),
    );
  }

  ngOnInit(): void {
  }

}
