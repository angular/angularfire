import { Component, OnInit } from '@angular/core';
import { RemoteConfig, getAllChanges } from '@angular/fire/remote-config';
import { traceUntilFirst } from '@angular/fire/performance';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-remote-config',
  template: `
    <p>
      Remote Config!
      {{ change$ | async | json }}
    </p>
  `,
  styles: []
})
export class RemoteConfigComponent implements OnInit {

  readonly change$: Observable<any>;

  constructor(public readonly remoteConfig: RemoteConfig) {
    this.change$ = getAllChanges(this.remoteConfig).pipe(traceUntilFirst('remote-config'));
  }

  ngOnInit(): void {
  }

}
