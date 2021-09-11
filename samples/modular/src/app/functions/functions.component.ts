import { Component, OnInit } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { EMPTY, Observable } from 'rxjs';

@Component({
  selector: 'app-functions',
  template: `
    <p>
      Functions!
      <code>{{ response$ | async | json }}</code>
      <button (click)="request()">Call!</button>
    </p>
  `,
  styles: []
})
export class FunctionsComponent implements OnInit {

  yadaFunction: (data: any) => Observable<any>;
  response$: Observable<any> = EMPTY;

  constructor(functions: Functions) {
    this.yadaFunction = httpsCallableData(functions, 'yada', { timeout: 3_000 });
  }

  ngOnInit(): void {}

  async request() {
    this.response$ = this.yadaFunction({});
  }

}
