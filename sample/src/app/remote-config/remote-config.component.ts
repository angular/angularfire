import { Component, inject, makeStateKey, PendingTasks, PLATFORM_ID, TransferState } from '@angular/core';
import { getAllChanges } from '@angular/fire/remote-config';
import { traceUntilFirst } from '@angular/fire/performance';
import { from, Observable, switchMap } from 'rxjs';
import { AsyncPipe, isPlatformServer, JsonPipe } from '@angular/common';
import { FirebaseApp } from '@angular/fire/app';

import { getRemoteConfig as getAdminRemoteConfig } from "firebase-admin/remote-config";
import { FirebaseAdminApp } from '../app.config';

import { getRemoteConfig, RemoteConfig, FetchResponse } from "@firebase/remote-config";

import { AllParameters } from 'rxfire/remote-config';

@Component({
  selector: 'app-remote-config',
  template: `<p>Remote Config! <code>{{ config$ | async | json }}</code></p>`,
  imports: [AsyncPipe, JsonPipe],
})
export class RemoteConfigComponent {

  private readonly transferState = inject(TransferState);
  private readonly transferStateKey = makeStateKey<FetchResponse>("remote-config-server-config");

  private readonly resolveRemoteConfig: Promise<RemoteConfig>;
  protected readonly config$: Observable<AllParameters>;

  constructor() {
    const firebaseApp = inject(FirebaseApp);
    if (isPlatformServer(inject(PLATFORM_ID))) {
      const serverApp = inject(FirebaseAdminApp);
      const adminRemoteConfig = getAdminRemoteConfig(serverApp);
      const pendingTasks = inject(PendingTasks);
      this.resolveRemoteConfig = pendingTasks.run(() =>
        adminRemoteConfig.getServerTemplate().then(template => {
          const serverConfig = template.evaluate();
          // Test out the new Admin SDK for constructing thing, once available
          // const initialFetchResponse = new RemoteConfigFetchResponse(serverApp, serverConfig);
          const initialFetchResponse = {
            status: 200,
            eTag: "asuidfhiouasf",
            config: { yada: "baz" },
          };
          this.transferState.set(this.transferStateKey, initialFetchResponse);
          return getRemoteConfig(firebaseApp, {
            initialFetchResponse,
          });
        })
      );
    } else {
      const initialFetchResponse =  this.transferState.get(this.transferStateKey, undefined);
      this.resolveRemoteConfig = Promise.resolve(getRemoteConfig(firebaseApp, {
        initialFetchResponse,
      }));
    }
    this.config$ = from(this.resolveRemoteConfig).pipe(
      switchMap(remoteConfig => getAllChanges(remoteConfig)),
      traceUntilFirst('remote-config'),
    );
  }

}
