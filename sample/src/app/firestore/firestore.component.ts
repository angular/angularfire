import { Component, inject, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { traceUntilFirst } from '@angular/fire/performance';
import { doc, docData, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { startWith, tap } from 'rxjs';
import { AsyncPipe, isPlatformServer, JsonPipe } from '@angular/common';
import { FirebaseApp } from '@angular/fire/app';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-firestore',
  template: `<p>
    Firestore!
    <code>{{ testDocValue | async | json }}</code>
  </p>`,
  imports: [ AsyncPipe, JsonPipe ]
})
export class FirestoreComponent {

  private readonly firestore;

  private readonly transferState = inject(TransferState);
  private readonly transferStateKey = makeStateKey<unknown|undefined>("firestore:test/1");
  public readonly testDocValue;

  protected readonly className = signal("is-deferred");

  constructor() {
    this.firestore = getFirestore(inject(FirebaseApp));
    if (!(this.firestore as any)._settingsFrozen && environment.emulatorPorts?.firestore) {
      connectFirestoreEmulator(this.firestore, "localhost", environment.emulatorPorts.firestore);
    }

    this.testDocValue = docData(doc(this.firestore, 'test/1')).pipe(
      traceUntilFirst('firestore'),
      isPlatformServer(inject(PLATFORM_ID)) ?
          tap(it => this.transferState.set(this.transferStateKey, it)) :
          this.transferState.hasKey(this.transferStateKey) ?
            startWith(this.transferState.get(this.transferStateKey, undefined)) :
            tap()
    );
  }

}
