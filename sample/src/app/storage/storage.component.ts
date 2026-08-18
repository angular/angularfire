import { Component, inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { from, startWith, tap } from 'rxjs';
import { traceUntilFirst } from '@angular/fire/performance';
import { connectStorageEmulator, getDownloadURL, getStorage, ref } from '@angular/fire/storage';
import { AsyncPipe, isPlatformServer } from '@angular/common';
import { FirebaseApp } from '@angular/fire/app';
import { environment } from '../../environments/environment';

const TRANSPARENT_PNG
  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

@Component({
  selector: 'app-storage',
  template: `
    <p>
      Storage!
      <img [src]="downloadUrl$ | async" width="64" height="64" />
    </p>
  `,
  imports: [AsyncPipe]
})
export class StorageComponent {

  private readonly storage = getStorage(inject(FirebaseApp));

  private readonly transferState = inject(TransferState);
  private readonly transferStateKey = makeStateKey<string|undefined>("storage:google-g.png");
  
  private readonly icon = ref(this.storage, 'google-g.png');

  protected readonly downloadUrl$ = from(getDownloadURL(this.icon)).pipe(
    traceUntilFirst('storage'),
    isPlatformServer(inject(PLATFORM_ID)) ?
        tap(it => this.transferState.set(this.transferStateKey, it)) :
        startWith(this.transferState.get(this.transferStateKey, TRANSPARENT_PNG))
  );

  constructor() {
    if (environment.emulatorPorts?.storage) {
      connectStorageEmulator(this.storage, "localhost", environment.emulatorPorts.storage);
    }
  }

}
