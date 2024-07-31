import { Component, Inject, NgZone, OnInit, Optional, makeStateKey, TransferState } from '@angular/core';
import { Auth, User, user } from '@angular/fire/auth';
import { traceUntilFirst } from '@angular/fire/performance';

import type { app } from 'firebase-admin';
import { Observable, of } from 'rxjs';
import { filter, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { FIREBASE_ADMIN } from '../app.module';

import type { Animal } from './lazyFirestore';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-upboats',
    template: `
    <ul>
      <li *ngFor="let animal of animals | async">
        <span>{{ animal.name }}</span>
        <button (click)="animal.upboat()" [disabled]="animal.fromCache || (this.user | async) === null">👍</button>
        <span>{{ animal.upboats }}</span>
        <button (click)="animal.downboat()" [disabled]="animal.fromCache || (this.user | async) === null">👎</button>
        <span *ngIf="animal.hasPendingWrites">🕒</span>
      </li>
    </ul>
    <button (click)="newAnimal()" [disabled]="!this.user">New animal</button>
  `,
    styles: [],
    standalone: true,
    imports: [NgFor, NgIf, AsyncPipe]
})
export class UpboatsComponent implements OnInit {

  public readonly animals: Observable<Animal[]>;
  public readonly user: Observable<User|null>;

  get lazyFirestore() {
    return import('./lazyFirestore');
  }

  constructor(
    state: TransferState,
    @Optional() auth: Auth,
    @Optional() @Inject(FIREBASE_ADMIN) admin: app.App,
    zone: NgZone,
  ) {
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
      switchMap(({ snapshotChanges }) => snapshotChanges(state, zone, admin)),
      <any>traceUntilFirst('animals'),
      tap((it: any) => {
        const cachedAnimals = it.map((animal: any) => ({ ...animal, hasPendingWrites: false, fromCache: true }));
        state.set(key, cachedAnimals);
      }),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
  }

  async newAnimal() {
    await (await this.lazyFirestore).newAnimal();
  }

}
