import { AsyncPipe, JsonPipe, isPlatformServer } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { traceUntilFirst } from '@angular/fire/performance';
import { getAllChanges, getRemoteConfig } from '@angular/fire/remote-config';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-remote-config',
  template: `<p>
    Remote Config! <code>{{ config$ | async | json }}</code>
  </p>`,
  imports: [AsyncPipe, JsonPipe],
})
export class RemoteConfigComponent {
  private readonly remoteConfig = isPlatformServer(inject(PLATFORM_ID))
    ? undefined
    : getRemoteConfig(inject(FirebaseApp));
  protected readonly config$ = this.remoteConfig
    ? getAllChanges(this.remoteConfig).pipe(traceUntilFirst('remote-config'))
    : EMPTY;
}
