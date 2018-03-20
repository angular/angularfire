import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { AngularFirestore, EnablePersistenceToken } from './firestore';
import '@firebase/firestore';

@NgModule({
  providers: [ AngularFirestore ]
})
export class AngularFirestoreModule {
  /**
   * Attempt to enable persistent storage, if possible
   */
  static enablePersistence(): ModuleWithProviders {
    return {
      ngModule: AngularFirestoreModule,
      providers: [
        { provide: EnablePersistenceToken, useValue: true },
      ]
    }
  }
}
