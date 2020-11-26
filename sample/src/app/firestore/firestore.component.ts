import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '../../firestore';
import { from, Observable } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { trace } from '@angular/fire/performance';

@Component({
  selector: 'app-firestore',
  template: `<p>
    Firestore!
    {{ testDocValue$ | async | json }}
    {{ persistenceEnabled$ | async }}
    {{ (persistenceProvider | async) || 'unknown (mangled)' }}
  </p>`,
  styles: [``]
})
export class FirestoreComponent implements OnInit {

  public readonly persistenceEnabled$: Observable<boolean>;
  public readonly testDocValue$: Observable<any>;
  public readonly persistenceProvider: any;

  constructor(state: TransferState, firestore: AngularFirestore) {
    this.persistenceProvider = from((firestore as any)._persistenceProvider).pipe(map(it => it?.constructor.name));
    const doc = firestore.doc('test/1');
    this.testDocValue$ = from(doc.ref).pipe(
      switchMap(ref => {
        const key = makeStateKey(ref.path);
        const existing = state.get(key, undefined);
        return doc.valueChanges().pipe(
          trace('firestore'),
          existing ? startWith(existing) : tap(it => state.set(key, it))
        );
      })
    );
    this.persistenceEnabled$ = firestore.persistenceEnabled$;
  }

  ngOnInit(): void {
  }

}
