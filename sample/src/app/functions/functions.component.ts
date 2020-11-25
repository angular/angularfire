import { Component, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
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

  response$: Observable<any>;

  constructor(public readonly functions: AngularFireFunctions) {
    this.response$ = EMPTY;
  }

  ngOnInit(): void {}

  request() {
    this.response$ = this.functions.httpsCallable('yada', { timeout: 3_000 })({});
  }

}
