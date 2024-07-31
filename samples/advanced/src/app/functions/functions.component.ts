import { Component, OnInit } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { EMPTY, Observable } from 'rxjs';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
    selector: 'app-functions',
    template: `
    <p>
      Functions!
      <code>{{ response$ | async | json }}</code>
      <button (click)="request()">Call!</button>
    </p>
  `,
    styles: [],
    standalone: true,
    imports: [AsyncPipe, JsonPipe]
})
export class FunctionsComponent implements OnInit {

  response$: Observable<any> = EMPTY;

  constructor() {
  }

  ngOnInit(): void {}

  async request() {
    this.response$ = (await import('./lazyFunctions')).yadaFunction({});
  }

}
