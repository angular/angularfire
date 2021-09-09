import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { persistenceEnabled as _persistenceEnabled } from '../app.module';
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
  public readonly persistenceEnabled = _persistenceEnabled;

  constructor(firestore: Firestore) {
    const ref = doc(firestore, 'test/1');
    this.testDocValue$ = docData(ref).pipe(
      traceUntilFirst('firestore')
    );
  }

  ngOnInit(): void {
  }

}
