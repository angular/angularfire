import { ModuleWithProviders, NgModule } from '@angular/core';
import { PersistenceSettings } from './interfaces';
import { AngularFirestore, EnablePersistenceToken, PersistenceSettingsToken } from './firestore';

import 'firebase/firestore';

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
        { provide: EnablePersistenceToken, useValue: true },
        { provide: PersistenceSettingsToken, useValue: persistenceSettings },
      ]
    }
  }
}
