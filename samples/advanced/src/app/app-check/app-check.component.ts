import { AsyncPipe, NgIf, SlicePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { keepUnstableUntilFirst } from '@angular/fire';
import { AppCheck, getToken } from '@angular/fire/app-check';
import { traceUntilFirst } from '@angular/fire/performance';
import { Observable, from, of } from 'rxjs';
import { catchError, share } from 'rxjs/operators';

@Component({
  selector: 'app-app-check',
  template: `
    <p>
      App Check!
      <code
        >{{ (change$ | async)?.token | slice : 0 : 12
        }}<ng-container *ngIf="(change$ | async) !== null"
          >&hellip;</ng-container
        ></code
      >
    </p>
  `,
  styles: [],
  standalone: true,
  imports: [NgIf, AsyncPipe, SlicePipe],
})
export class AppCheckComponent implements OnInit {
  readonly change$: Observable<any>;

  constructor(appCheck: AppCheck) {
    this.change$ = from(getToken(appCheck)).pipe(
      keepUnstableUntilFirst,
      traceUntilFirst('app-check'),
      catchError(() => of(null)),
      share()
    );
  }

  ngOnInit(): void {}
}
