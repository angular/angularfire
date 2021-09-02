import { Component, OnInit } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { EMPTY, Observable } from 'rxjs';

@Component({
  selector: 'app-functions',
  template: `
    <p>
      Functions!
      {{ response$ | async | json }}
      <button (click)="request()">Call!</button>
    </p>
  `,
  styles: []
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
