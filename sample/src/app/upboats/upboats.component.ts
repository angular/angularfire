import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { trace } from '@angular/fire/performance';
import { AngularFirestore } from '@angular/fire/firestore';

type Animal = { name: string, upboats: number, id: string, hasPendingWrites: boolean };

@Component({
  selector: 'app-upboats',
  templateUrl: './upboats.component.html',
  styleUrls: ['./upboats.component.css']
})
export class UpboatsComponent implements OnInit {

  public animals: Observable<Animal[]>;

  constructor(private firestore: AngularFirestore, state: TransferState) {
    const collection = firestore.collection<Animal>('animals', async ref => {
      const { orderBy, query } = await import('./query');
      return query(ref, orderBy('upboats', 'desc'), orderBy('updatedAt', 'desc'));
    });
    const key = makeStateKey('animals');
    const existing = state.get(key, undefined);
    this.animals = collection.snapshotChanges().pipe(
      trace('animals'),
      map(it => it.map(change => ({
        ...change.payload.doc.data(),
        id: change.payload.doc.id,
        hasPendingWrites: change.payload.doc.metadata.hasPendingWrites
      }))),
      existing ? startWith(existing) : tap(it => state.set(key, it))
    );
  }

  ngOnInit(): void {
  }

  async upboat(id: string) {
    const { increment, serverTimestamp } = await import('./update');
    // TODO add rule
    return await this.firestore.doc(`animals/${id}`).update({
      upboats: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  async downboat(id: string) {
    const { increment, serverTimestamp } = await import('./update');
    // TODO add rule
    return await this.firestore.doc(`animals/${id}`).update({
      upboats: increment(-1),
      updatedAt: serverTimestamp(),
    });
  }

  async newAnimal() {
    const { serverTimestamp } = await import('./update');
    // TODO add rule
    return await this.firestore.collection('animals').add({
      name: prompt('Can haz name?'),
      upboats: 1,
      updatedAt: serverTimestamp(),
    });
  }

}
