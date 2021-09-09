import { Component, OnInit, Optional } from '@angular/core';
import { Observable, of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';
import { Auth, user, User } from '@angular/fire/auth';
import { addDoc, collection, collectionData, doc, Firestore, increment, orderBy, query, serverTimestamp, updateDoc } from '@angular/fire/firestore';

export type Animal = {
  name: string,
  upboats: number,
  id: string,
  hasPendingWrites: boolean,
};

@Component({
  selector: 'app-upboats',
  template: `
    <ul>
      <li *ngFor="let animal of animals | async">
          <span>{{ animal.name }}</span>
          <button (click)="upboat(animal.id)" [disabled]="(this.user | async) === null">👍</button>
          <span>{{ animal.upboats }}</span>
          <button (click)="downboat(animal.id)" [disabled]="(this.user | async) === null">👎</button>
          <span *ngIf="animal.hasPendingWrites">🕒</span>
      </li>
    </ul>
    <button (click)="newAnimal()" [disabled]="!this.user">New animal</button>
  `,
  styles: []
})
export class UpboatsComponent implements OnInit {

  public readonly animals: Observable<Animal[]>;
  public user: Observable<User|null>;

  constructor(private readonly firestore: Firestore, @Optional() auth: Auth) {
    // INVESTIGATE why do I need to share user to keep the zone stable?
    // perhaps it related to why N+1 renders fail
    this.user = auth ? user(auth).pipe(shareReplay({ bufferSize: 1, refCount: false })) : of(null);
    const animalsCollection = collection(firestore, 'animals').withConverter<Animal>({
      fromFirestore: snapshot => {
        const { name, upboats } = snapshot.data();
        const { id } = snapshot;
        const { hasPendingWrites } = snapshot.metadata;
        return { id, name, upboats, hasPendingWrites };
      },
      // TODO unused can we make implicit?
      toFirestore: (it: any) => it,
    });
    const animalsQuery = query(animalsCollection, orderBy('upboats', 'desc'), orderBy('updatedAt', 'desc'));

    this.animals = collectionData(animalsQuery).pipe(
      traceUntilFirst('animals')
    );
  }

  ngOnInit(): void {
  }

  async upboat(id: string) {
    return await updateDoc(doc(this.firestore, `animals/${id}`), {
        upboats: increment(1),
        updatedAt: serverTimestamp(),
    });
  }

  async downboat(id: string) {
    return await updateDoc(doc(this.firestore, `animals/${id}`), {
      upboats: increment(-1),
      updatedAt: serverTimestamp(),
    });
  }

  async newAnimal() {
    return await addDoc(collection(this.firestore, 'animals'), {
      name: prompt('Can haz name?'),
      upboats: 1,
      updatedAt: serverTimestamp(),
    });
  }

}
