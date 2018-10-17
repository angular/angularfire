import { ModuleWithProviders, NgModule } from '@angular/core';
import { AngularFirestore, EnablePersistenceToken, PersistenceSettingsToken } from './firestore';

import 'firebase/firestore';
import { firestore } from 'firebase/app';

@NgModule({
  providers: [ AngularFirestore ]
})
export class AngularFirestoreModule {
  /**
   * Attempt to enable persistent storage, if possible
   */
  static enablePersistence(persistenceSettings?: firestore.PersistenceSettings): ModuleWithProviders {
    return {
      ngModule: AngularFirestoreModule,
      providers: [
        { provide: EnablePersistenceToken, useValue: true },
        { provide: PersistenceSettingsToken, useValue: persistenceSettings },
      ]
    }
  }
}
