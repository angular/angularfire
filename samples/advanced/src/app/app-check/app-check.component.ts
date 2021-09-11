import { Component, OnInit } from '@angular/core';
import { getToken, AppCheck } from '@angular/fire/app-check';
import { traceUntilFirst } from '@angular/fire/performance';
import { from, Observable } from 'rxjs';
import { keepUnstableUntilFirst } from '@angular/fire';

@Component({
  selector: 'app-app-check',
  template: `
    <p>
      App Check!
      {{ change$ | async | json }}
    </p>
  `,
  styles: []
})
export class AppCheckComponent implements OnInit {

  readonly change$: Observable<any>;

  constructor(appCheck: AppCheck) {
    this.change$ = from(getToken(appCheck)).pipe(
      keepUnstableUntilFirst,
      traceUntilFirst('app-check')
    );
  }

  ngOnInit(): void {
  }

}
