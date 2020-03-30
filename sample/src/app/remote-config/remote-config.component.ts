import { Component, OnInit } from '@angular/core';
import { AngularFireRemoteConfig } from '@angular/fire/remote-config';

@Component({
  selector: 'app-remote-config',
  template: `
    <p>
      Remote Config!
      {{ remoteConfig.changes | async | json }}
    </p>
  `,
  styles: []
})
export class RemoteConfigComponent implements OnInit {

  constructor(public readonly remoteConfig: AngularFireRemoteConfig) {
    
  }

  ngOnInit(): void {
  }

}
