import { ModuleWithProviders, NgModule } from '@angular/core';
import { PersistenceSettings } from './interfaces';
import { AngularFirestore, ENABLE_PERSISTENCE, PERSISTENCE_SETTINGS } from './firestore';
import firebase from 'firebase/compat/app';
import { VERSION } from '@angular/fire';

@NgModule({
  providers: [ AngularFirestore ]
})
export class AngularFirestoreModule {
  constructor() {
    firebase.registerVersion('angularfire', VERSION.full, 'fst-compat');
  }
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
