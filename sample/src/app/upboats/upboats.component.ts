import { Component, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { traceUntilFirst } from '@angular/fire/performance';

export type Animal = {
  name: string,
  upboats: number,
  id: string,
  hasPendingWrites: boolean,
  changeType: string,
};

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
          <span>{{ animal.changeType }}</span>
      </li>
    </ul>
    <button (click)="newAnimal()">New animal</button>
  `,
  styles: []
})
export class UpboatsComponent implements OnInit, OnDestroy {

  public readonly animals: Observable<Animal[]>;
  private readonly collectionChanges: Observable<any>;
  private subscription: Subscription|undefined;

  get lazyFirestore() {
    return import('./lazyFirestore');
  }

  constructor(state: TransferState) {
    const key = makeStateKey<Animal[]>('ANIMALS');
    const existing = state.get(key, undefined);
    this.animals = of(undefined).pipe(
      switchMap(() => this.lazyFirestore),
      switchMap(({ snapshotChanges }) => snapshotChanges),
      traceUntilFirst('animals'),
      tap(it => state.set<Animal[]>(key, it)),
      existing ? startWith(existing) : tap(),
    );
    this.collectionChanges = of(undefined).pipe(
      switchMap(() => this.lazyFirestore),
      switchMap(({ collectionChanges }) => collectionChanges),
    );
  }

  ngOnInit(): void {
    if (isDevMode()) {
      this.subscription = this.collectionChanges.subscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async upboat(id: string) {
    await (await this.lazyFirestore).upboat(id);
  }

  async downboat(id: string) {
    await (await this.lazyFirestore).downboat(id);
  }

  async newAnimal() {
    await (await this.lazyFirestore).newAnimal();
  }

}
