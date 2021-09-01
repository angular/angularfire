import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { concatMap, filter, startWith, switchMap, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { traceUntilFirst } from '@angular/fire/performance';

export type Animal = { name: string, upboats: number, id: string, hasPendingWrites: boolean };

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

  constructor(state: TransferState) {
    const key = makeStateKey<Animal[]>('ANIMALS');
    const existing = state.get(key, undefined);
    this.animals = of(undefined).pipe(
      switchMap(() => import('./lazyFirestore')),
      switchMap(({ snapshotChanges }) => snapshotChanges),
      traceUntilFirst('animals'),
      tap(it => state.set<Animal[]>(key, it)),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
  }

  async upboat(id: string) {
    await (await import('./lazyFirestore')).upboat(id);
  }

  async downboat(id: string) {
    await (await import('./lazyFirestore')).downboat(id);
  }

  async newAnimal() {
    await (await import('./lazyFirestore')).newAnimal();
  }

}
