import { NgModule, InjectionToken } from '@angular/core';
import { FirebaseApp, AngularFireModule } from 'angularfire2';
import { AngularFirestore } from './firestore';
import { from } from 'rxjs/observable/from';

export const EnablePersistenceToken = new InjectionToken<boolean>('EnablePersistenceToken');

export function _getAngularFirestore(app: FirebaseApp, enablePersistence: boolean) {
  return new AngularFirestore(app, enablePersistence);
}

export const AngularFirestoreProvider = {
  provide: AngularFirestore,
  useFactory: _getAngularFirestore,
  deps: [ FirebaseApp, EnablePersistenceToken ]
};

export const FIRESTORE_PROVIDERS = [
  AngularFirestoreProvider,
  { provide: EnablePersistenceToken, useValue: false },
];

@NgModule({
  imports: [ AngularFireModule ],
  providers: [ FIRESTORE_PROVIDERS ]
})
export class AngularFirestoreModule {
  static enablePersistence() {
    return {
      ngModule: AngularFireModule,
      providers: [
        { provide: EnablePersistenceToken, useValue: true },
        AngularFirestoreProvider
      ]
    }
  }
}
