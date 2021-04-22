import { Component, OnInit } from '@angular/core';
import { AngularFireRemoteConfig, mapToObject } from '@angular/fire/remote-config';
import { trace } from '@angular/fire/performance';
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
