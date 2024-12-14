import { Component, inject, makeStateKey, OnInit, PLATFORM_ID, TransferState } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';
import { Auth } from '@angular/fire/auth';
import { addDoc, collection, collectionData, connectFirestoreEmulator, doc, getFirestore, increment, orderBy, query, serverTimestamp, updateDoc } from '@angular/fire/firestore';
import { AsyncPipe, isPlatformServer } from '@angular/common';
import { authState } from '../auth/auth.component';
import { FirebaseApp } from '@angular/fire/app';
import { environment } from '../../environments/environment';

export type Animal = {
  name: string,
  upboats: number,
  id: string,
  hasPendingWrites: boolean,
};

@Component({
  selector: 'app-upboats',
  template: `
  <div>
    <ul>
      @for (animal of (animals | async); track animal.id) {
        <li>
          {{ animal.name }}
          <button (click)="upboat(animal.id)" [disabled]="(this.disableInputs | async)">👍</button>
          {{ animal.upboats }}
          <button (click)="downboat(animal.id)" [disabled]="(this.disableInputs | async)">👎</button>
          @if (animal.hasPendingWrites) { 🕒 }
        </li>
      }
    </ul>
    <button (click)="newAnimal()" [disabled]="(this.disableInputs | async)">New animal</button>
  </div>
  `,
  styles: ["div.is-deferred { opacity: 0.5; }"],
  imports: [AsyncPipe],
})
export class UpboatsComponent implements OnInit {

  private readonly transferState = inject(TransferState);
  private readonly transferStateKeys = {
    disableInputs: makeStateKey<boolean>("upboats:disableInputs"),
    animals: makeStateKey<Animal[]>("upboats:animals"),
  } as const;

  protected readonly disableInputs = authState(inject(Auth)).pipe(
    map(it => !it),
    isPlatformServer(inject(PLATFORM_ID)) ?
        tap(it => this.transferState.set(this.transferStateKeys.disableInputs, it)) :
        startWith(this.transferState.get(this.transferStateKeys.disableInputs, true))
  );

  public readonly animals: Observable<Animal[]>;

  private readonly firestore;

  constructor() {
    this.firestore = getFirestore(inject(FirebaseApp));;
    if (!(this.firestore as any)._settingsFrozen && environment.emulatorPorts?.firestore) {
      connectFirestoreEmulator(this.firestore, "localhost", environment.emulatorPorts.firestore);
    }

    const animalsCollection = collection(this.firestore, 'animals').withConverter<Animal>({
      fromFirestore: snapshot => {
        const { name, upboats } = snapshot.data();
        const { id } = snapshot;
        const { hasPendingWrites } = snapshot.metadata;
        return { id, name, upboats, hasPendingWrites };
      },
      toFirestore: (it: any) => it,
    });
    const animalsQuery = query(animalsCollection, orderBy('upboats', 'desc'), orderBy('updatedAt', 'desc'));

    this.animals = collectionData(animalsQuery).pipe(
      traceUntilFirst('animals'),
      isPlatformServer(inject(PLATFORM_ID)) ?
        tap(it => this.transferState.set(this.transferStateKeys.animals, it)) :
        this.transferState.hasKey(this.transferStateKeys.animals) ?
          startWith(this.transferState.get(this.transferStateKeys.animals, [])) :
          tap()
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
