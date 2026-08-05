import { AsyncPipe, JsonPipe, isPlatformServer } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  TransferState,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  connectFirestoreEmulator,
  doc,
  docData,
  getFirestore,
} from '@angular/fire/firestore';
import { traceUntilFirst } from '@angular/fire/performance';
import { startWith, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-firestore',
  template: `<p>
    Firestore!
    <code>{{ testDocValue | async | json }}</code>
  </p>`,
  imports: [AsyncPipe, JsonPipe],
})
export class FirestoreComponent {
  private readonly firestore;

  private readonly transferState = inject(TransferState);
  private readonly transferStateKey = makeStateKey<unknown | undefined>(
    'firestore:test/1'
  );
  public readonly testDocValue;

  protected readonly className = signal('is-deferred');

  constructor() {
    this.firestore = getFirestore(inject(FirebaseApp));
    if (
      !(this.firestore as any)._settingsFrozen &&
      environment.emulatorPorts?.firestore
    ) {
      connectFirestoreEmulator(
        this.firestore,
        'localhost',
        environment.emulatorPorts.firestore
      );
    }

    this.testDocValue = docData(doc(this.firestore, 'test/1')).pipe(
      traceUntilFirst('firestore'),
      isPlatformServer(inject(PLATFORM_ID))
        ? tap((it) => this.transferState.set(this.transferStateKey, it))
        : this.transferState.hasKey(this.transferStateKey)
        ? startWith(this.transferState.get(this.transferStateKey, undefined))
        : tap()
    );
  }
}
