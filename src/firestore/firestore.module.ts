import { ModuleWithProviders, NgModule } from '@angular/core';
import { PersistenceSettings } from '@firebase/firestore-types';
import { AngularFirestore, ENABLE_PERSISTENCE, PERSISTENCE_SETTINGS } from './firestore';

import 'firebase/firestore'; // removed in build process when not UMD

@NgModule({
  providers: [ AngularFirestore ]
})
export class AngularFirestoreModule {
  /**
   * Attempt to enable persistent storage, if possible
   */
  static enablePersistence(persistenceSettings?: PersistenceSettings): ModuleWithProviders<AngularFirestoreModule> {
    return {
      ngModule: AngularFirestoreModule,
      providers: [
        { provide: ENABLE_PERSISTENCE, useValue: true },
        { provide: PERSISTENCE_SETTINGS, useValue: persistenceSettings },
      ]
    };
  }
}
