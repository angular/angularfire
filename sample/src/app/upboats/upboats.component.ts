import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import {
  Firestore, collection, query, orderBy, fromRef,
  doc, updateDoc, addDoc, increment, serverTimestamp
} from '@angular/fire/firestore';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { traceUntilFirst } from '@angular/fire/performance';

type Animal = { name: string, upboats: number, id: string, hasPendingWrites: boolean };

@Component({
  selector: 'app-upboats',
  template: `
    <ul>
      <li *ngFor="let animal of animals | async">
          <span>{{ animal.name }}</span>
          <button (click)="upboat(animal.id)">👍</button>
          <span>{{ animal.upboats }}</span>
          <button (click)="downboat(animal.id)">👎</button>
          <span *ngIf="animal.hasPendingWrites">🕒</span>
      </li>
    </ul>
    <button (click)="newAnimal()">New animal</button>
  `,
  styles: []
})
export class UpboatsComponent implements OnInit {

  public readonly animals: Observable<Animal[]>;

  constructor(private firestore: Firestore, state: TransferState) {
    const animalsCollection = collection(firestore, 'animals');
    const animalsQuery = query(animalsCollection, orderBy('upboats', 'desc'), orderBy('updatedAt', 'desc'));
    const key = makeStateKey<Animal[]>(animalsCollection.path);
    const existing = state.get(key, undefined);
    this.animals = fromRef(animalsQuery).pipe(
      traceUntilFirst('animals'),
      map(it => it.docs.map(change => ({
        ...change.data(),
        id: change.id,
        hasPendingWrites: change.metadata.hasPendingWrites
      } as Animal))),
      existing ? startWith(existing) : tap(it => state.set<Animal[]>(key, it))
    );
  }

  ngOnInit(): void {
  }

  async upboat(id: string) {
    // TODO add rule
    return await updateDoc(doc(this.firestore, `animals/${id}`), {
      upboats: increment(1),
      updatedAt: serverTimestamp(),
    });
  }

  async downboat(id: string) {
    // TODO add rule
    return await updateDoc(doc(this.firestore, `animals/${id}`), {
      upboats: increment(-1),
      updatedAt: serverTimestamp(),
    });
  }

  async newAnimal() {
    // TODO add rule
    return await addDoc(collection(this.firestore, 'animals'), {
      name: prompt('Can haz name?'),
      upboats: 1,
      updatedAt: serverTimestamp(),
    });
  }

}
