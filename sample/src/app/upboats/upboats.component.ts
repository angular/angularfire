import { Component, OnInit, Optional } from '@angular/core';
import { Observable, of } from 'rxjs';
import { filter, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { traceUntilFirst } from '@angular/fire/performance';
import { Auth, user, User } from '@angular/fire/auth';

import type { Animal } from './lazyFirestore';

@Component({
  selector: 'app-upboats',
  template: `
    <ul>
      <li *ngFor="let animal of animals | async">
          <span>{{ animal.name }}</span>
          <button (click)="upboat(animal.id)" [disabled]="animal.fromCache || currentlyVotingOn.includes(animal.id) || (this.user | async) === null">👍</button>
          <span>{{ animal.upboats }}</span>
          <button (click)="downboat(animal.id)" [disabled]="animal.fromCache || currentlyVotingOn.includes(animal.id) || (this.user | async) === null">👎</button>
          <span *ngIf="animal.hasPendingWrites">🕒</span>
      </li>
    </ul>
    <button (click)="newAnimal()" [disabled]="!this.user">New animal</button>
  `,
  styles: []
})
export class UpboatsComponent implements OnInit {

  public readonly animals: Observable<Animal[]>;
  public readonly user: Observable<User|null>;
  public readonly currentlyVotingOn: Array<string> = [];

  get lazyFirestore() {
    return import('./lazyFirestore');
  }

  constructor(state: TransferState, @Optional() auth: Auth) {
    const key = makeStateKey<Animal[]>('ANIMALS');
    const existing = state.get(key, undefined);
    // INVESTIGATE why do I need to share user to keep the zone stable?
    // perhaps it related to why N+1 renders fail
    this.user = auth ? user(auth).pipe(shareReplay({ bufferSize: 1, refCount: false })) : of(null);
    const start = auth && existing ?
      this.user.pipe(filter(it => !!it)) :
      of(null);
    this.animals = start.pipe(
      switchMap(() => this.lazyFirestore),
      switchMap(({ snapshotChanges }) => snapshotChanges),
      traceUntilFirst('animals'),
      tap(it => {
        const cachedAnimals = it.map(animal => ({ ...animal, fromCache: true }));
        state.set<Animal[]>(key, cachedAnimals);
      }),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
  }

  async upboat(id: string) {
    const index = this.currentlyVotingOn.push(id) - 1;
    await (await this.lazyFirestore).upboat(id);
    delete this.currentlyVotingOn[index];
  }

  async downboat(id: string) {
    const index = this.currentlyVotingOn.push(id) - 1;
    await (await this.lazyFirestore).downboat(id);
    delete this.currentlyVotingOn[index];
  }

  async newAnimal() {
    await (await this.lazyFirestore).newAnimal();
  }

}
