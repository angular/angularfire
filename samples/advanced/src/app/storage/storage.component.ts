import { Component, OnInit, makeStateKey, TransferState } from '@angular/core';
import { keepUnstableUntilFirst } from '@angular/fire';
import { traceUntilFirst } from '@angular/fire/performance';

import { Observable, of } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';

const TRANSPARENT_PNG
  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

@Component({
  selector: 'app-storage',
  template: `
    <p>
      Storage!
      <img [src]="downloadUrl$ | async" width="64" height="64" />
    </p>
  `,
  styles: []
})
export class StorageComponent implements OnInit {

  public readonly downloadUrl$: Observable<string>;

  constructor(state: TransferState) {
    const key = makeStateKey<string>('google-icon-url');
    const existing = state.get(key, undefined);
    this.downloadUrl$ = existing ? of(existing) : of(undefined).pipe(
      switchMap(() => import('./lazyStorage')),
      switchMap(({ iconUrl }) => iconUrl),
      <any>keepUnstableUntilFirst,
      <any>traceUntilFirst('storage'),
      tap(it => state.set(key, it)),
      startWith(TRANSPARENT_PNG),
    ) as any;
  }

  ngOnInit(): void {
  }

}
