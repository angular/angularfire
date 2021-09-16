import { Component, OnInit } from '@angular/core';
import { AngularFireRemoteConfig, mapToObject } from '@angular/fire/compat/remote-config';
import { trace } from '@angular/fire/compat/performance';
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

  constructor(public readonly remoteConfig: AngularFireRemoteConfig) {
    this.change$ = remoteConfig.parameters.pipe(trace('remote-config'), mapToObject({}));
  }

  ngOnInit(): void {
  }

}
