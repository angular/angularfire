import { Component, OnInit, Optional } from '@angular/core';
import { Observable, of } from 'rxjs';
import { filter, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { traceUntilFirst } from '@angular/fire/performance';
import { Auth, user, User } from '@angular/fire/auth';

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
          <button (click)="upboat(animal.id)" [disabled]="(this.user | async) === null">👍</button>
          <span>{{ animal.upboats }}</span>
          <button (click)="downboat(animal.id)" [disabled]="(this.user | async) === null">👎</button>
          <span *ngIf="animal.hasPendingWrites">🕒</span>
          <span>{{ animal.changeType }}</span>
      </li>
    </ul>
    <button (click)="newAnimal()" [disabled]="!this.user">New animal</button>
  `,
  styles: []
})
export class UpboatsComponent implements OnInit {

  public readonly animals: Observable<Animal[]>;
  public user: Observable<User|null>;

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
      tap(it => state.set<Animal[]>(key, it)),
      existing ? startWith(existing) : tap(),
    );
  }

  ngOnInit(): void {
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
