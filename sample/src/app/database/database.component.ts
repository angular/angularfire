import { Component, inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { startWith, tap } from 'rxjs';
import { connectDatabaseEmulator, getDatabase, objectVal, ref } from '@angular/fire/database';
import { AsyncPipe, isPlatformServer, JsonPipe } from '@angular/common';
import { FirebaseApp } from '@angular/fire/app';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-database',
  template: `
    <p>
      Database!
      <code>{{ testObjectValue$ | async | json }}</code>
    </p>
  `,
  imports: [AsyncPipe, JsonPipe]
})
export class DatabaseComponent {

  private readonly database;

  private readonly transferState = inject(TransferState);
  private readonly transferStateKey = makeStateKey<unknown|undefined>("database:test");
  protected readonly testObjectValue$;

  constructor() {
    this.database = getDatabase(inject(FirebaseApp));
    if (!(this.database as any)._instanceStarted && environment.emulatorPorts?.database) {
      connectDatabaseEmulator(this.database, "localhost", environment.emulatorPorts.database);
    }

    this.testObjectValue$ = objectVal(ref(this.database, "test")).pipe(
      isPlatformServer(inject(PLATFORM_ID)) ?
          tap(it => this.transferState.set(this.transferStateKey, it)) :
          this.transferState.hasKey(this.transferStateKey) ?
            startWith(this.transferState.get(this.transferStateKey, undefined)) :
            tap()
    );
  }
}
