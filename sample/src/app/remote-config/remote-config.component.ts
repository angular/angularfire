import { Component, inject, PLATFORM_ID } from '@angular/core';
import { getAllChanges, getRemoteConfig } from '@angular/fire/remote-config';
import { traceUntilFirst } from '@angular/fire/performance';
import { EMPTY } from 'rxjs';
import { AsyncPipe, isPlatformServer, JsonPipe } from '@angular/common';
import { FirebaseApp } from '@angular/fire/app';

@Component({
  selector: 'app-remote-config',
  template: `<p>Remote Config! <code>{{ config$ | async | json }}</code></p>`,
  imports: [AsyncPipe, JsonPipe],
})
export class RemoteConfigComponent {

  private readonly remoteConfig = isPlatformServer(inject(PLATFORM_ID)) ? undefined : getRemoteConfig(inject(FirebaseApp));
  protected readonly config$ = this.remoteConfig ?
    getAllChanges(this.remoteConfig).pipe(
      traceUntilFirst('remote-config'),
    ) :
    EMPTY;

}
