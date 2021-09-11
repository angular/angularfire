import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { trace } from '@angular/fire/compat/performance';

@Component({
  selector: 'app-firestore',
  template: `<p>
    Firestore!
    {{ testDocValue$ | async | json }}
    {{ persistenceEnabled$ | async }}
  </p>`,
  styles: [``]
})
export class FirestoreComponent implements OnInit {

  public readonly persistenceEnabled$: Observable<boolean>;
  public readonly testDocValue$: Observable<any>;

  constructor(firestore: AngularFirestore) {
    const doc = firestore.doc('test/1');
    this.testDocValue$ = firestore.doc('test/1').valueChanges().pipe(
      trace('firestore'),
    );
    this.persistenceEnabled$ = firestore.persistenceEnabled$;
  }

  ngOnInit(): void {
  }

}
