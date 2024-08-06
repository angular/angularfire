import { Component, OnInit } from '@angular/core';
import { keepUnstableUntilFirst } from '@angular/fire';
import { AppCheck, getToken } from '@angular/fire/app-check';
import { traceUntilFirst } from '@angular/fire/performance';
import { Observable, from } from 'rxjs';
import { share } from 'rxjs/operators';
import { NgIf, AsyncPipe, SlicePipe } from '@angular/common';

@Component({
    selector: 'app-app-check',
    template: `
    <p>
      App Check!
      <code>{{ (change$ | async)?.token | slice:0:12 }}<ng-container *ngIf="(change$ | async) !== null">&hellip;</ng-container></code>
    </p>
  `,
    styles: [],
    standalone: true,
    imports: [NgIf, AsyncPipe, SlicePipe]
})
export class AppCheckComponent implements OnInit {

  readonly change$: Observable<any>;

  constructor(appCheck: AppCheck) {
    this.change$ = from(getToken(appCheck)).pipe(
      <any>keepUnstableUntilFirst,
      <any>traceUntilFirst('app-check'),
      share(),
    );
  }

  ngOnInit(): void {
  }

}
