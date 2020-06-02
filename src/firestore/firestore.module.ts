import { ModuleWithProviders, NgModule } from '@angular/core';
import { PersistenceSettings } from './interfaces';
import { AngularFirestore, ENABLE_PERSISTENCE, PERSISTENCE_SETTINGS } from './firestore';

@NgModule({
  providers: [ AngularFirestore ]
})
export class AngularFirestoreModule {
  /**
   * Attempt to enable persistent storage, if possible
   */
  static enablePersistence(persistenceSettings?: PersistenceSettings): ModuleWithProviders {
    return {
      ngModule: AngularFirestoreModule,
      providers: [
        { provide: ENABLE_PERSISTENCE, useValue: true },
        { provide: PERSISTENCE_SETTINGS, useValue: persistenceSettings },
      ]
    };
  }
}
