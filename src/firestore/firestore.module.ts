import { InjectionToken, ModuleWithProviders, NgModule } from '@angular/core';
import { FirebaseApp, AngularFireModule } from 'angularfire2';
import { AngularFirestore } from './firestore';
import { from } from 'rxjs/observable/from';
import '@firebase/firestore';

import { EnablePersistenceToken } from './enable-persistance-token';

@NgModule({
  imports: [ AngularFireModule ],
  providers: [
    AngularFirestore,
  ]
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
